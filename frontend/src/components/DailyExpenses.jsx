import { useState, useEffect } from 'react';
import axios from 'axios';
import EditExpenseModal from './EditExpenseModal';

function DailyExpenses({ userId }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [expenses, setExpenses] = useState([]);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    // Fetch all expenses initially to filter by date locally
    // (Or fetch by date if the API supports it, but here we can reuse existing logic)
    const fetchExpenses = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/user-data/${userId}`);
            if (response.data.status === 'success') {
                setExpenses(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [userId]);

    useEffect(() => {
        const formattedSelected = selectedDate.toISOString().split('T')[0];
        const filtered = expenses.filter(exp => exp.date === formattedSelected);
        setDailyExpenses(filtered);
    }, [selectedDate, expenses]);

    // Calendar logic
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();
    const daysCount = daysInMonth(currentYear, currentMonth);
    const startOffset = firstDayOfMonth(currentYear, currentMonth);

    const handlePrevMonth = () => {
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleDateClick = (day) => {
        setSelectedDate(new Date(currentYear, currentMonth, day));
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    };

    const isSelected = (day) => {
        return selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', borderRadius: '12px', background: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={handlePrevMonth} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>&lt;</button>
                <h2 style={{ margin: 0 }}>{monthNames[currentMonth]} {currentYear}</h2>
                <button onClick={handleNextMonth} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>&gt;</button>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginBottom: '30px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px', color: '#666' }}>{day}</div>
                ))}

                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    return (
                        <div
                            key={day}
                            onClick={() => handleDateClick(day)}
                            style={{
                                padding: '10px',
                                textAlign: 'center',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isSelected(day) ? '#4a90e2' : isToday(day) ? '#e1f5fe' : 'transparent',
                                color: isSelected(day) ? 'white' : 'inherit',
                                border: isToday(day) ? '1px solid #4a90e2' : '1px solid transparent',
                                fontWeight: isToday(day) || isSelected(day) ? 'bold' : 'normal'
                            }}
                            onMouseEnter={(e) => { if (!isSelected(day)) e.target.style.background = '#f5f5f5' }}
                            onMouseLeave={(e) => { if (!isSelected(day)) e.target.style.background = isToday(day) ? '#e1f5fe' : 'transparent' }}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Daily Expense List */}
            <div style={{ borderTop: '2px solid #eee', paddingTop: '20px' }}>
                <h3>{selectedDate.toLocaleDateString()}</h3>
                {loading ? (
                    <p>Loading...</p>
                ) : dailyExpenses.length === 0 ? (
                    <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No expenses recorded for this day.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Item</th>
                                <th style={{ padding: '10px' }}>Category</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyExpenses.map((exp, idx) => (
                                <tr
                                    key={exp.id || idx}
                                    onClick={() => {
                                        setSelectedExpense(exp);
                                        setShowEditModal(true);
                                    }}
                                    style={{
                                        borderBottom: '1px solid #f9f9f9',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td style={{ padding: '10px' }}>{exp.item}</td>
                                    <td style={{ padding: '10px' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#e3f2fd', color: '#1976d2', fontSize: '12px' }}>
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                        {exp.amount} {exp.currency}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 'bold' }}>
                                <td colSpan="2" style={{ padding: '10px', textAlign: 'right' }}>Total:</td>
                                <td style={{ padding: '10px', textAlign: 'right' }}>
                                    {dailyExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>

            {showEditModal && selectedExpense && (
                <EditExpenseModal
                    expense={selectedExpense}
                    userId={userId}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedExpense(null);
                    }}
                    onSave={fetchExpenses}
                />
            )}
        </div>
    );
}

export default DailyExpenses;
