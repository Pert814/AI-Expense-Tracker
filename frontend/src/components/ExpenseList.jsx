import { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import { guestExpenseService, expenseCacheService } from '../services/guestStorage';

// ExpenseList component for displaying expense history
function ExpenseList({ refreshTrigger, user }) {
    const isGuest = !user;
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // 排序邏輯func，快取資料跟雲端資料都會用到
    const sortExpenses = (data) => {
        return Array.isArray(data)
            ? [...data].sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return (b.id || '').localeCompare(a.id || '');
            })
            : [];
    };

    //method to fetch user data from backend endpoint or localstorage
    const fetchExpenses = async () => {
        // 訪客模式：完全只碰localstorage，邏輯不變
        if (isGuest) {
            setExpenses(sortExpenses(guestExpenseService.getAll()));
            setLoading(false);
            return;
        }

        // 登入模式：先看有沒有localstorage，有的話立刻顯示
        const cached = expenseCacheService.get(user.id);
        if (cached) {
            setExpenses(sortExpenses(cached));
            setLoading(false); // 已經有東西可以看，不用轉圈圈
        } else {
            setLoading(true); // 從沒快取過（第一次用這台裝置），才顯示 loading
        }

        setError(null);

        // 不管有沒有快取，都去背景抓雲端最新資料
        try {
            const response = await expenseService.getAll();
            const data = response.data.status === 'success' ? response.data.data : [];
            const sorted = sortExpenses(data);

            setExpenses(sorted);                      // 更新畫面成最新的
            expenseCacheService.set(user.id, sorted);  // 順便更新本機快取，當下次的鏡子
        } catch (err) {
            console.error('Error fetching expenses:', err);
            // 已經有快取顯示著的話，這次抓失敗就不跳錯誤，維持顯示快取即可
            if (!cached) {
                setError('Failed to load expense history.');
            }
        } finally {
            setLoading(false);
        }
    };

    // method to delete user record
    const handleDelete = async (recordId) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        try {
            const response = await expenseService.delete(recordId);
            if (response.data.status === 'success') {
                // Refresh list after deletion
                fetchExpenses();
            }
        } catch (err) {
            console.error('Error deleting record:', err);
            alert('Failed to delete the record.');
        }
    };

    // Fetch data on component mount or when refreshTrigger changes
    useEffect(() => {
        fetchExpenses();
    }, [refreshTrigger, isGuest]);

    if (loading && expenses.length === 0) return <p style={{ fontSize: '0.7rem' }}>LOADING DATA...</p>;
    if (error) return <p style={{ color: 'var(--pixel-danger)', fontSize: '0.7rem' }}>{error}</p>;

    return (
        <div className="pixel-border" style={{ maxWidth: '800px', margin: '30px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '0.8rem' }}>RECENT RECORDS</h3>
                <button
                    className="pixel-button"
                    onClick={fetchExpenses}
                    style={{ fontSize: '0.6rem' }}
                >
                    REFRESH
                </button>
            </div>

            {expenses.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--pixel-gray)', padding: '20px', fontSize: '0.7rem' }}>NO COINS SPENT YET.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="pixel-table">
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>TYPE</th>
                                <th>ITEM</th>
                                <th style={{ textAlign: 'right' }}>CASH</th>
                                <th style={{ textAlign: 'center' }}>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.slice(0, 5).map((expense, index) => (
                                <tr key={expense.id || index}>
                                    <td>{expense.date}</td>
                                    <td>
                                        <span style={{ color: 'var(--pixel-primary)' }}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td>{expense.item}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {expense.amount}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="pixel-button danger"
                                            onClick={() => handleDelete(expense.id || index)}
                                            style={{ fontSize: '0.5rem', padding: '4px 8px' }}
                                        >
                                            DEL
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ExpenseList;
