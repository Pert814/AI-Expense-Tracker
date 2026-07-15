import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { authService } from '../services/api';
import LoadingScreen from './LoadingScreen';

// login component with firebase google sign in
function Login({ onLoginSuccess }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseIdToken = await result.user.getIdToken();
            const backendResponse = await authService.login(firebaseIdToken);
            if (backendResponse.data.status === 'success') {
                const userData = backendResponse.data.user;
                localStorage.setItem('user', JSON.stringify(userData));
                onLoginSuccess(userData);
            }
        } catch (error) {
            console.error('Error handling login:', error);
            alert('SYSTEM ERROR: UNABLE TO CONNECT TO VAULT.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a1a',
            color: 'white',
            padding: '2rem'
        }}>
            {isLoading && <LoadingScreen text="AUTHENTICATING & SYNCING..." />}
            <div className="pixel-border" style={{
                background: 'white',
                color: '#212529',
                textAlign: 'center',
                padding: '4rem 2rem',
                maxWidth: '500px'
            }}>
                <h1 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--pixel-primary)' }}>AI-XPNS TRACKER</h1>
                <div style={{ height: '4px', background: 'var(--pixel-dark)', margin: '0 0 2rem 0' }}></div>

                <p style={{ fontSize: '0.6rem', marginBottom: '3rem', lineHeight: '2' }}>
                    INSERT TOKEN TO START <br />
                    MANAGING YOUR PERSONAL COINS
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <button
                        className="pixel-button primary"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        style={{ fontSize: '0.7rem', padding: '0.8rem 1.5rem' }}
                    >
                        SIGN IN WITH GOOGLE
                    </button>
                </div>

                <p style={{ fontSize: '0.4rem', color: 'var(--pixel-gray)', marginTop: '2rem' }}>
                    READY PLAYER ONE
                </p>
            </div>
        </div>
    );
}

export default Login;