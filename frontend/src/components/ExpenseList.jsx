import { useState, useEffect } from 'react';
import axios from 'axios';
// ExpenseList component for displaying expense history
function ExpenseList({ userId, refreshTrigger }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // method to fetch user data from backend endpoint
    const fetchExpenses = async () => {
        if (!userId) {
            alert("User ID is missing");
            return;
        }

        alert(`Fetching expenses for userId: ${userId}, API URL: ${API_BASE_URL}`);
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/user-data/${userId}`);
            if (response.data.status === 'success') {
                setExpenses(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching expenses:', err);
            alert(`Failed to load expense history: ${err.message}`);
            setError('Failed to load expense history.');
        } finally {
            setLoading(false);
        }
    };
    // method to delete user record
    const handleDelete = async (recordId) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;

        try {
            const response = await axios.delete(`${API_BASE_URL}/user-data/${userId}/${recordId}`);
            if (response.data.status === 'success') {
                // Refresh list after deletion
                fetchExpenses();
            }
        } catch (err) {
            console.error('Error deleting record:', err);
            alert('Failed to delete the record.');
        }
    };

    // Fetch data on component mount or when userId/refreshTrigger changes
    useEffect(() => {
        fetchExpenses();
    }, [userId, refreshTrigger]);

    if (loading && expenses.length === 0) return <p>Loading history...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Recent Added Expenses</h3>
                <button
                    onClick={fetchExpenses}
                    style={{ background: 'none', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '5px 10px' }}
                >
                    Refresh
                </button>
            </div>

            {expenses.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No records found. Try adding one!</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px 10px' }}>Date</th>
                                <th style={{ padding: '12px 10px' }}>Category</th>
                                <th style={{ padding: '12px 10px' }}>Item</th>
                                <th style={{ padding: '12px 10px' }}>Note</th>
                                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '12px 10px', textAlign: 'center' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.slice(0, 5).map((expense, index) => (
                                <tr
                                    key={expense.id || index}
                                    style={{
                                        borderBottom: '1px solid #f5f5f5',
                                    }}
                                >
                                    <td style={{ padding: '12px 10px' }}>{expense.date}</td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#e3f2fd', color: '#1976d2', fontSize: '13px' }}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 10px' }}>{expense.item}</td>
                                    <td style={{ padding: '12px 10px' }}>{expense.note}</td>
                                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        {expense.amount} {expense.currency}
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(expense.id || index)}
                                            style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
                                        >
                                            Delete
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
