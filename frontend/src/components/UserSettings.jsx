import { useState, useEffect } from 'react';
import { userService } from '../services/api'; 
import { guestUserService } from '../services/guestStorage';

function UserSettings({ onUpdateSuccess, user }) {
    const isGuest = !user;const [syncStatus, setSyncStatus] = useState('synced'); // synced | pending | offline | 'guest'
    const [userInfo, setUserInfo] = useState({ name: '', categories: [], currency: 'TWD' });
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUserInfo();
    }, [user]);

    const fetchUserInfo = async () => {
        if (isGuest) {
            setUserInfo(guestUserService.getInfo());
            setSyncStatus('guest');
            setLoading(false);
            return;
        }

        try {
            const response = await userService.getInfo();
            if (response.data.status === 'success') {
                setUserInfo(response.data.data);
                // 拿到雲端最新設定，順便備份一份到本機（isPending = false，代表這份跟雲端一致）
                guestUserService.update(response.data.data, false);
                setSyncStatus('synced');
            }
        } catch (err) {
            console.error('Failed to fetch user info, falling back to local cache:', err);
            // 打不到後端（離線），退回讀本機備份
            const cached = guestUserService.getInfo();
            setUserInfo(cached);
            setSyncStatus('offline');
            setMessage({ type: 'error', text: 'OFFLINE: SHOWING LOCALLY CACHED SETTINGS.' });
        } finally {
            setLoading(false);
        }
    };      

    const handleUpdateInfo = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const payload = {
            name: userInfo.name,
            categories: userInfo.categories,
            currency: userInfo.currency,
            stats_start_date: userInfo.stats_start_date
        };

        if (isGuest) {
            guestUserService.update(payload, false);
            setSyncStatus('guest');
            setMessage({ type: 'success', text: 'SAVED LOCALLY (GUEST MODE).' });
            if (onUpdateSuccess) onUpdateSuccess(userInfo);
            setSaving(false);
            return;
        }
        try {
            const response = await userService.update(payload);

            if (response.data.status === 'success') {
                // 存後端成功，順便更新本機備份，並清掉待同步標記
                guestUserService.update(payload, false);
                guestUserService.clearPendingSync();
                setSyncStatus('synced');
                setMessage({ type: 'success', text: 'Settings updated successfully!' });
                if (onUpdateSuccess) onUpdateSuccess(userInfo);
            }
        } catch (err) {
            console.error('Failed to update user info, saving locally instead:', err);
            // 打不到後端（離線），先存本機，標記待同步
            guestUserService.update(payload, true);
            setSyncStatus('pending');
            setMessage({ type: 'error', text: 'OFFLINE: SAVED LOCALLY. WILL SYNC WHEN ONLINE.' });
        } finally {
            setSaving(false);
        }
        };
    
    // for login user without internet can sync to cloud later
    const handleSyncNow = async () => {
        if (isGuest) return; // 訪客沒有雲端可以同步

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const localData = guestUserService.getInfo();
            const response = await userService.update({
                name: localData.name,
                categories: localData.categories,
                currency: localData.currency,
                stats_start_date: localData.stats_start_date
            });

            if (response.data.status === 'success') {
                guestUserService.clearPendingSync();
                setSyncStatus('synced');
                setMessage({ type: 'success', text: 'SYNCED TO CLOUD SUCCESSFULLY!' });
            }
        } catch (err) {
            console.error('Manual sync failed:', err);
            setMessage({ type: 'error', text: 'SYNC FAILED. STILL OFFLINE?' });
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

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <div className="pixel-loader"></div>
            <p style={{ fontSize: '0.6rem', marginTop: '10px' }}>LOADING CONFIG...</p>
        </div>
    );

    return (
        <div className="pixel-border" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'left' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1rem' }}>USER PROFILE</h2>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                fontSize: '0.6rem',
                color:
                    syncStatus === 'synced' ? 'var(--pixel-success)' :
                    syncStatus === 'pending' ? 'var(--pixel-danger)' :
                    'var(--pixel-gray)'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'currentColor',
                    display: 'inline-block'
                }}></span>
                {syncStatus === 'synced' && 'SYNCED WITH CLOUD'}
                {syncStatus === 'pending' && (
                    <>
                        LOCAL CHANGES NOT YET SYNCED
                        <button
                            type="button"
                            className="pixel-button primary"
                            onClick={handleSyncNow}
                            disabled={saving}
                            style={{ fontSize: '0.5rem', padding: '2px 8px', margin: 0 }}
                        >
                            {saving ? 'SYNCING...' : 'SYNC NOW'}
                        </button>
                    </>
                )}
                {syncStatus === 'offline' && 'OFFLINE — SHOWING LOCAL CACHE'}
                {syncStatus === 'guest' && 'GUEST MODE — LOCAL ONLY, LOGIN TO SYNC TO CLOUD'}
            </div>

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
                        disabled={saving}
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
                        disabled={saving}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem' }}>STATS START DATE</label>
                    <input
                        className="pixel-input"
                        type="date"
                        value={userInfo.stats_start_date || ''}
                        onChange={(e) => setUserInfo({ ...userInfo, stats_start_date: e.target.value })}
                        disabled={saving}
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
                            disabled={saving}
                        />
                        <button
                            className="pixel-button success"
                            type="button"
                            onClick={addCategory}
                            style={{ margin: 0 }}
                            disabled={saving}
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
                                    disabled={saving}
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
                    style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    {saving ? (
                        <>
                            <div className="pixel-loader" style={{ width: '14px', height: '14px', border: '2px solid white' }}></div>
                            SAVING...
                        </>
                    ) : 'SAVE CONFIG'}
                </button>
            </form>
        </div>
    );
}

export default UserSettings;
