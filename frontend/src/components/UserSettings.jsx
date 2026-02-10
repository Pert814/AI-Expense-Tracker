import { useState, useEffect } from 'react';
import axios from 'axios';

function UserSettings({ userId, onUpdateSuccess }) {
    const [userInfo, setUserInfo] = useState({ name: '', categories: [], currency: 'TWD' });
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const API_BASE_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchUserInfo();
    }, [userId]);

    const fetchUserInfo = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
            if (response.data.status === 'success') {
                setUserInfo(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch user info:', err);
            setMessage({ type: 'error', text: 'Failed to load user settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.put(`${API_BASE_URL}/user/${userId}`, {
                name: userInfo.name,
                categories: userInfo.categories,
                currency: userInfo.currency
            });

            if (response.data.status === 'success') {
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                if (onUpdateSuccess) onUpdateSuccess(userInfo);
            }
        } catch (err) {
            console.error('Failed to update user info:', err);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    const addCategory = () => {
        if (newCategory.trim() && !userInfo.categories.includes(newCategory.trim())) {
            setUserInfo({
                ...userInfo,
                categories: [...userInfo.categories, newCategory.trim()]
            });
            setNewCategory('');
        }
    };

    const removeCategory = (catToRemove) => {
        setUserInfo({
            ...userInfo,
            categories: userInfo.categories.filter(cat => cat !== catToRemove)
        });
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '30px', borderRadius: '12px', background: '#fff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', textAlign: 'left' }}>
            <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>User Settings</h2>

            {message.text && (
                <div style={{
                    padding: '10px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    background: message.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: message.type === 'success' ? '#155724' : '#721c24'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdateInfo}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Display Name</label>
                    <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Default Currency</label>
                    <input
                        type="text"
                        value={userInfo.currency || ''}
                        onChange={(e) => setUserInfo({ ...userInfo, currency: e.target.value })}
                        placeholder="e.g., TWD, USD"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Categories</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Add new category"
                            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                        <button
                            type="button"
                            onClick={addCategory}
                            style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Add
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {userInfo.categories.map(cat => (
                            <span key={cat} style={{
                                background: '#e9ecef',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px'
                            }}>
                                {cat}
                                <button
                                    type="button"
                                    onClick={() => removeCategory(cat)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc3545', fontWeight: 'bold', fontSize: '16px', padding: 0 }}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </form>
        </div>
    );
}

export default UserSettings;
