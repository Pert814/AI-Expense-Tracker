import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

// Login component for Google OAuth
function Login({ onLoginSuccess }) {
    const handleSuccess = async (response) => {
        console.log('Google Login Success:', response);
        const idToken = response.credential;
        // temporary store user info in localStorage
        try {
            const base64Url = idToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const user = JSON.parse(jsonPayload);

            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', idToken);

            onLoginSuccess(user);
        } catch (error) {
            console.error('Error handling login:', error);
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
