import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = "651073678330-chqniufgdpg51ed3em1lavmtcl5fqpo2.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
  {/* functional renderless component*/}
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* -> App.jsx  */}
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
