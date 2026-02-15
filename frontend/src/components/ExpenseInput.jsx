import { useState } from 'react';
import axios from 'axios';
// ExpenseInput component for submitting expenses via AI parsing
function ExpenseInput({ userId, onSuccess }) {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Use environment variable for the API URL
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    // handle form submission after user click submit button
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);
        // send user input to backend for AI parsing
        try {
            const response = await axios.post(`${API_BASE_URL}/parse-expense`, {
                text: text,
                user_id: userId
            });

            if (response.data.status === 'success') {
                setResult(response.data.data);
                setText(''); // Clear input
                if (onSuccess) onSuccess(); // Signal other components to refresh
            }
        } catch (err) {
            console.error('Parsing error:', err);
            alert(`Failed to parse text: ${err.message}`);
            setError('Failed to parse text. Please ensure the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', borderRadius: '12px', background: '#f9f9f9', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '15px' }}>Record New Expense</h3>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g., Spent 200 on dinner yesterday"
                    style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', fontSize: '16px' }}
                />
                <button
                    type="submit"
                    disabled={loading || !text}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: loading ? '#ccc' : '#4a90e2',
                        color: 'white',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.3s'
                    }}
                >
                    {loading ? 'AI Parsing...' : 'Submit to AI'}
                </button>
            </form>

            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

            {result && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#e1f5fe', borderRadius: '8px', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#0288d1' }}>✅ Parse Successful!</h4>
                    <p><strong>Item:</strong> {result.item}</p>
                    <p><strong>Amount:</strong> {result.amount} {result.currency}</p>
                    <p><strong>Category:</strong> {result.category}</p>
                    <p><strong>Date:</strong> {result.date}</p>
                    <p><strong>Note:</strong> {result.note}</p>
                </div>
            )}
        </div>
    );
}

export default ExpenseInput;
