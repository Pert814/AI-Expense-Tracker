import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { expenseService } from '../services/api';
import { guestExpenseService, expenseCacheService } from '../services/guestStorage';

// 這裏統一資料流的處理,之後每個components用hooks統一調用
// 包含：
// 1. 登入者跟訪客模式都統一走一套邏輯
// 2. 登入者模式會用 localstorage 作為快取，登入後自動載入，避免每次打 API
// 3. 訪客模式直接用 localstorage 儲存
const ExpenseContext = createContext(null);

export function useExpenses() {
    return useContext(ExpenseContext);
}

export function ExpenseProvider({ children, user, authReady }) {
    const isGuest = !user;
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sorting helper: sorts by date descending, then ID descending
    const sortExpenses = useCallback((data) => {
        return Array.isArray(data)
            ? [...data].sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return (b.id || '').localeCompare(a.id || '');
            })
            : [];
    }, []);

    // Main fetch function
    const fetchExpenses = useCallback(async () => {
        // Guest Mode
        if (isGuest) {
            setExpenses(sortExpenses(guestExpenseService.getAll()));
            setLoading(false);
            setError(null);
            return;
        }

        // Login Mode: Check local cache first for instant load
        const cached = expenseCacheService.get(user.id);
        if (cached) {
            setExpenses(sortExpenses(cached));
            setLoading(false);
        } else {
            setLoading(true);
        }

        setError(null);

        // Fetch from cloud in background
        try {
            const response = await expenseService.getAll();
            const data = response.data.status === 'success' ? response.data.data : [];
            const sorted = sortExpenses(data);

            setExpenses(sorted);
            expenseCacheService.set(user.id, sorted);
        } catch (err) {
            console.error('Error fetching expenses from cloud:', err);
            // Only show error if we have no cached data to display
            if (!cached) {
                setError('Failed to load expense history from cloud.');
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id, isGuest, sortExpenses]);

    // Add a new expense
    const addExpense = useCallback(async (parsedData) => {
        setError(null);
        try {
            if (isGuest) {
                const newRecord = guestExpenseService.create(parsedData);
                setExpenses(prev => sortExpenses([newRecord, ...prev]));
                return newRecord;
            } else {
                const response = await expenseService.create(parsedData);
                if (response.data.status === 'success') {
                    const newRecord = response.data.data;
                    // Background sync to ensure local state has complete server updates
                    await fetchExpenses();
                    return newRecord;
                }
            }
        } catch (err) {
            console.error('Error adding expense:', err);
            throw err;
        }
    }, [isGuest, fetchExpenses, sortExpenses]);

    // Delete an expense
    const deleteExpense = useCallback(async (recordId) => {
        setError(null);
        try {
            if (isGuest) {
                guestExpenseService.delete(recordId);
                setExpenses(prev => prev.filter(item => item.id !== recordId));
            } else {
                const response = await expenseService.delete(recordId);
                if (response.data.status === 'success') {
                    setExpenses(prev => {
                        const updated = prev.filter(item => item.id !== recordId);
                        expenseCacheService.set(user.id, updated);
                        return updated;
                    });
                }
            }
        } catch (err) {
            console.error('Error deleting expense:', err);
            throw err;
        }
    }, [isGuest, user?.id]);

    // Update/Edit an expense
    const updateExpense = useCallback(async (recordId, formData) => {
        setError(null);
        try {
            if (isGuest) {
                const updated = guestExpenseService.update(recordId, formData);
                if (updated) {
                    setExpenses(prev => sortExpenses(prev.map(item => item.id === recordId ? updated : item)));
                }
                return updated;
            } else {
                const response = await expenseService.update(recordId, formData);
                if (response.data.status === 'success') {
                    // Refetch from cloud to get updated list & sync cache
                    await fetchExpenses();
                }
            }
        } catch (err) {
            console.error('Error updating expense:', err);
            throw err;
        }
    }, [isGuest, fetchExpenses, sortExpenses]);

    // Fetch expenses on mount or when user shifts
    useEffect(() => {
        if (authReady) {
            fetchExpenses();
        }
    }, [fetchExpenses, authReady]);

    return (
        <ExpenseContext.Provider value={{
            expenses,
            loading,
            error,
            fetchExpenses,
            addExpense,
            deleteExpense,
            updateExpense
        }}>
            {children}
        </ExpenseContext.Provider>
    );
}
