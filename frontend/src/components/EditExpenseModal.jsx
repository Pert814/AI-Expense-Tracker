import { useState } from 'react';
import { expenseService } from '../services/api';

function EditExpenseModal({ expense, onClose, onSave }) {
    const [formData, setFormData] = useState({
        item: expense.item || '',
        amount: expense.amount || '',
        category: expense.category || '',
        date: expense.date || '',
        note: expense.note || '',
        currency: expense.currency || 'USD'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await expenseService.update(expense.id, formData);
            if (response.data.status === 'success') {
                onSave();
                onClose();
            }
        } catch (err) {
            console.error('Error updating record:', err);
            setError('Failed to update the record. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="pixel-border" style={{
                background: 'white',
                width: '90%',
                maxWidth: '500px',
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1rem' }}>EDIT ITEM</h3>
                {error && <p style={{ color: 'var(--pixel-danger)', fontSize: '0.6rem' }}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.7rem' }}>ITEM</label>
                        <input
                            className="pixel-input"
                            type="text"
                            name="item"
                            value={formData.item}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.7rem' }}>CASH</label>
                            <input
                                className="pixel-input"
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.7rem' }}>TYPE</label>
                            <input
                                className="pixel-input"
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.7rem' }}>TIME</label>
                        <input
                            className="pixel-input"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.7rem' }}>NOTE</label>
                        <textarea
                            className="pixel-input"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            style={{ minHeight: '60px', resize: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="button"
                            className="pixel-button"
                            onClick={onClose}
                        >
                            CLOSE
                        </button>
                        <button
                            type="submit"
                            className="pixel-button primary"
                            disabled={loading}
                        >
                            {loading ? 'WAIT...' : 'SAVE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditExpenseModal;
