import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function Login({ onLoginSuccess }) {
    const handleSuccess = async (response) => {
        console.log('Google Login Success:', response);
        const idToken = response.credential;

        try {
            // 這裡可以選擇是否要發送到後端驗證，或者先在前端存起來
            // 為了「不頻繁登入」，我們先存入 localStorage

            // 解析 JWT (不驗證，只是為了拿使用者姓名/Email 顯示)
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
            <p>請先登入以開始管理你的收支</p>
            <div style={{ marginTop: '20px' }}>
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    useOneTap
                />
            </div>
        </div>
    );
}

export default Login;
