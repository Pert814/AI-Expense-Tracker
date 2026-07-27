import { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import EditExpenseModal from './EditExpenseModal';

// 這版面只想顯示日期 所以定義這個函式
function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [, month, day] = parts;
    return `${month}/${day}`;
}


function ExpenseList({ user }) {
    const { expenses, loading, error, fetchExpenses } = useExpenses();
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

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
                                <th>ITEM</th>
                                <th style={{ textAlign: 'right' }}>CASH</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.slice(0, 10).map((expense, index) => (
                                <tr
                                    key={expense.id || index}
                                    onClick={() => {
                                        setSelectedExpense(expense);
                                        setShowEditModal(true);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{formatDateShort(expense.date)}</td>
                                    <td>{expense.item}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {expense.amount}{expense.currency || ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showEditModal && selectedExpense && (
                <EditExpenseModal
                    expense={selectedExpense}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedExpense(null);
                    }}
                />
            )}
        </div>
    );
}

export default ExpenseList;
