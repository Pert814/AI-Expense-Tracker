import { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import EditExpenseModal from './EditExpenseModal';

function DailyExpenses() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [expenses, setExpenses] = useState([]);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Fetch all expenses initially to filter by date locally
    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await expenseService.getAll();
            if (response.data.status === 'success') {
                const data = response.data.data;
                setExpenses(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

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
        <div className="pixel-border" style={{ maxWidth: '800px', margin: '20px auto' }}>
            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button className="pixel-button" onClick={handlePrevMonth}>&lt;</button>
                <h2 style={{ margin: 0, fontSize: '1rem' }}>{monthNames[currentMonth]} {currentYear}</h2>
                <button className="pixel-button" onClick={handleNextMonth}>&gt;</button>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '30px' }}>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px', fontSize: '0.6rem', color: 'var(--pixel-gray)' }}>{day}</div>
                ))}

                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysCount }).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day);
                    const today = isToday(day);
                    return (
                        <div
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className="pixel-button"
                            style={{
                                padding: '10px 0',
                                textAlign: 'center',
                                background: selected ? 'var(--pixel-primary)' : today ? 'var(--pixel-warning)' : 'white',
                                color: selected ? 'white' : 'black',
                                fontSize: '0.7rem',
                                margin: 0,
                                boxSizing: 'border-box'
                            }}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            {/* Daily Expense List */}
            <div style={{ borderTop: '4px solid #212529', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '0.8rem' }}>{selectedDate.toDateString()}</h3>
                {loading ? (
                    <p style={{ fontSize: '0.7rem' }}>LOADING...</p>
                ) : dailyExpenses.length === 0 ? (
                    <p style={{ color: 'var(--pixel-gray)', textAlign: 'center', padding: '20px', fontSize: '0.7rem' }}>NO RECORDS ON THIS DAY.</p>
                ) : (
                    <table className="pixel-table">
                        <thead>
                            <tr>
                                <th>ITEM</th>
                                <th>TYPE</th>
                                <th style={{ textAlign: 'right' }}>CASH</th>
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
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{exp.item}</td>
                                    <td>
                                        <span style={{ color: 'var(--pixel-primary)' }}>
                                            {exp.category}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                        {exp.amount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 'bold' }}>
                                <td colSpan="2" style={{ textAlign: 'right' }}>TOTAL:</td>
                                <td style={{ textAlign: 'right' }}>
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
