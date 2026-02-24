import { GoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';

// Login component for Google OAuth
function Login({ onLoginSuccess }) {
    const handleSuccess = async (response) => {
        console.log('Google Login Success:', response);
        const idToken = response.credential;

        try {
            // Call backend to verify token and initialize user
            const backendResponse = await authService.login(idToken);

            if (backendResponse.data.status === 'success') {
                const userData = backendResponse.data.user;

                // Store token and user info
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', idToken);

                onLoginSuccess(userData);
            }
        } catch (error) {
            console.error('Error handling login:', error);
            alert('Authentication with server failed. Please try again.');
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
        }}>
            <h1>AI Expense Tracker</h1>
            <p>Please log in to start managing your expenses</p>
            <div style={{ marginTop: '20px' }}>
                <GoogleLogin
                    clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                />
            </div>
        </div>
    );
}

export default Login;
