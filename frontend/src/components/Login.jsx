import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';

function Login({ onLoginSuccess }) {
    const handleSuccess = async (response) => {
        const idToken = response.credential;
        try {
            const backendResponse = await authService.login(idToken);
            if (backendResponse.data.status === 'success') {
                const userData = backendResponse.data.user;
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', idToken);
                onLoginSuccess(userData);
            }
        } catch (error) {
            console.error('Error handling login:', error);
            alert('SYSTEM ERROR: UNABLE TO CONNECT TO VAULT.');
        }
    };

    const handleError = () => {
        console.log('Login Failed');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#1a1a1a',
            color: 'white',
            padding: '2rem'
        }}>
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
                    <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={handleError}
                        useOneTap
                        ux_mode="redirect"
                    />
                </div>

                <p style={{ fontSize: '0.4rem', color: 'var(--pixel-gray)', marginTop: '2rem' }}>
                    READY PLAYER ONE
                </p>
            </div>
        </div>
    );
}

export default Login;
