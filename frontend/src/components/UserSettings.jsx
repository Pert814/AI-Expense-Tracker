import { useState, useEffect } from 'react';
import { userService } from '../services/api';

function UserSettings({ onUpdateSuccess }) {
    const [userInfo, setUserInfo] = useState({ name: '', categories: [], currency: 'TWD' });
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const response = await userService.getInfo();
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
            const response = await userService.update({
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

    if (loading) return <div style={{ fontSize: '0.7rem' }}>LOADING...</div>;

    return (
        <div className="pixel-border" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'left' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1rem' }}>USER PROFILE</h2>

            {message.text && (
                <div className="pixel-border" style={{
                    padding: '10px',
                    marginBottom: '20px',
                    background: message.type === 'success' ? 'var(--pixel-success)' : 'var(--pixel-danger)',
                    color: 'white',
                    fontSize: '0.6rem'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleUpdateInfo}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem' }}>NICKNAME</label>
                    <input
                        className="pixel-input"
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem' }}>CURRENCY</label>
                    <input
                        className="pixel-input"
                        type="text"
                        value={userInfo.currency || ''}
                        onChange={(e) => setUserInfo({ ...userInfo, currency: e.target.value })}
                        placeholder="E.G. TWD"
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem' }}>CATEGORIES</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                            className="pixel-input"
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="NEW TAG"
                            style={{ flex: 1, marginBottom: 0 }}
                        />
                        <button
                            className="pixel-button success"
                            type="button"
                            onClick={addCategory}
                            style={{ margin: 0 }}
                        >
                            ADD
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {userInfo.categories.map(cat => (
                            <span key={cat} className="pixel-border" style={{
                                padding: '4px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.6rem',
                                background: '#eee'
                            }}>
                                {cat}
                                <button
                                    type="button"
                                    onClick={() => removeCategory(cat)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--pixel-danger)', fontWeight: 'bold' }}
                                >
                                    X
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <button
                    className="pixel-button primary"
                    type="submit"
                    disabled={saving}
                    style={{ width: '100%', marginTop: '1rem' }}
                >
                    {saving ? 'SAVING...' : 'SAVE CONFIG'}
                </button>
            </form>
        </div>
    );
}

export default UserSettings;
