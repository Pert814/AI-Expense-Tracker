import { useState, useEffect } from 'react';
import { expenseService } from '../services/api';

// ExpenseList component for displaying expense history
function ExpenseList({ refreshTrigger }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // method to fetch user data from backend endpoint
    const fetchExpenses = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await expenseService.getAll();
            if (response.data.status === 'success') {
                // Handle different response structures if necessary
                const data = response.data.data;
                setExpenses(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError('Failed to load expense history.');
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
    }, [refreshTrigger]);

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
