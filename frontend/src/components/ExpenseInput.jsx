import { useState } from 'react';
import { expenseService } from '../services/api';

function ExpenseInput({ onSuccess }) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [parsedData, setParsedData] = useState(null);
    const [error, setError] = useState(null);

    // Step 1: Parse the natural language text
    const handleParse = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        setError(null);
        setParsedData(null);

        try {
            const response = await expenseService.parse(text);
            if (response.data.status === 'success') {
                setParsedData(response.data.data);
            }
        } catch (err) {
            console.error('Parsing error:', err);
            setError('AI parsing failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Save the reviewed data to database
    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await expenseService.create(parsedData);
            if (response.data.status === 'success') {
                setParsedData(null);
                setText('');
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            console.error('Saving error:', err);
            setError('Failed to save record.');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setParsedData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="pixel-border" style={{ maxWidth: '600px', margin: '20px auto' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '0.9rem' }}>NEW TRANSACTION</h3>

            {!parsedData ? (
                <form onSubmit={handleParse}>
                    <textarea
                        className="pixel-input"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="E.G. I bought a coffee for 150 today"
                        style={{ minHeight: '100px', resize: 'none' }}
                        disabled={loading}
                    />
                    <button
                        className="pixel-button primary"
                        type="submit"
                        disabled={loading || !text}
                        style={{ width: '100%', margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {loading ? (
                            <>
                                <div className="pixel-loader" style={{ width: '14px', height: '14px', border: '2px solid white' }}></div>
                                AI ANALYZING...
                            </>
                        ) : 'SENT TO AI'}
                    </button>
                    <p style={{ fontSize: '0.5rem', marginTop: '10px', color: 'var(--pixel-gray)' }}>
                        USE NATURAL LANGUAGE. AI WILL EXTRACT DETAILS.
                    </p>
                </form>
            ) : (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <h4 style={{ fontSize: '0.7rem', color: 'var(--pixel-secondary)', marginBottom: '15px' }}>
                        PLEASE REVIEW AND CONFIRM:
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>ITEM</label>
                            <input
                                className="pixel-input"
                                style={{ marginBottom: 0 }}
                                value={parsedData.item}
                                onChange={(e) => handleFieldChange('item', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>CATEGORY</label>
                            <input
                                className="pixel-input"
                                style={{ marginBottom: 0 }}
                                value={parsedData.category}
                                onChange={(e) => handleFieldChange('category', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>AMOUNT</label>
                            <input
                                className="pixel-input"
                                style={{ marginBottom: 0 }}
                                type="number"
                                value={parsedData.amount}
                                onChange={(e) => handleFieldChange('amount', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>CURRENCY</label>
                            <input
                                className="pixel-input"
                                style={{ marginBottom: 0 }}
                                value={parsedData.currency}
                                onChange={(e) => handleFieldChange('currency', e.target.value)}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>DATE</label>
                            <input
                                className="pixel-input"
                                style={{ marginBottom: 0 }}
                                type="date"
                                value={parsedData.date}
                                onChange={(e) => handleFieldChange('date', e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="pixel-button"
                            onClick={() => setParsedData(null)}
                            style={{ flex: 1, margin: 0 }}
                        >
                            RE-EDIT
                        </button>
                        <button
                            className="pixel-button success"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ flex: 2, margin: 0 }}
                        >
                            {saving ? 'SAVING...' : 'CONFIRM & SAVE'}
                        </button>
                    </div>
                </div>
            )}

            {error && <p style={{ color: 'var(--pixel-danger)', marginTop: '15px', fontSize: '0.6rem', textAlign: 'center' }}>{error}</p>}
        </div>
    );
}

export default ExpenseInput;
