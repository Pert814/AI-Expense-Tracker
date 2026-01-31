import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import ExpenseInput from './components/ExpenseInput'

function App() {
  const [user, setUser] = useState(null)

  // check localStorage for user info
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])
  // logout function 
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />
  }
  // after login, show app main page
  return (
    <div className="app-container">
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#eee' }}>
        <span>Hello, {user.name}</span>
        <button onClick={handleLogout}>Logout</button>
      </nav>

      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Welcome to AI Expense Tracker</h1>
        <p>Your Email: {user.email}</p>

        <ExpenseInput userId={user.sub} />

        <div className="card" style={{ marginTop: '30px' }}>
          <p>Future charts and history will be here</p>
        </div>
      </main>
    </div>
  )
}

export default App

