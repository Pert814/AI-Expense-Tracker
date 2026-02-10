import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import ExpenseInput from './components/ExpenseInput'
import ExpenseList from './components/ExpenseList'
import DailyExpenses from './components/DailyExpenses'
import UserSettings from './components/UserSettings'

function App() {
  const [user, setUser] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentView, setCurrentView] = useState('home') // 'home', 'daily', or 'settings'

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

  // update user name in state and localStorage
  const handleUserUpdate = (updatedInfo) => {
    const newUser = { ...user, name: updatedInfo.name }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />
  }
  // after login, show app main page
  return (
    <div className="app-container">
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#333', color: 'white' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>AI Tracker</span>
          <button
            onClick={() => setCurrentView('home')}
            style={{ background: currentView === 'home' ? '#4a90e2' : 'transparent', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView('daily')}
            style={{ background: currentView === 'daily' ? '#4a90e2' : 'transparent', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Daily View
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Hello, {user.name}</span>
          <button
            onClick={() => setCurrentView('settings')}
            style={{ background: currentView === 'settings' ? '#4a90e2' : '#555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Settings
          </button>
          <button onClick={handleLogout} style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>

      <main style={{ padding: '2rem', textAlign: 'center' }}>
        {currentView === 'home' && (
          <>
            <h1>Welcome to AI Expense Tracker</h1>
            <p>Your Email: {user.email}</p>

            <ExpenseInput
              userId={user.sub}
              onSuccess={() => setRefreshTrigger(prev => prev + 1)}
            />

            <ExpenseList
              userId={user.sub}
              refreshTrigger={refreshTrigger}
            />
          </>
        )}

        {currentView === 'daily' && (
          <>
            <h1>Daily Expense History</h1>
            <DailyExpenses userId={user.sub} />
          </>
        )}

        {currentView === 'settings' && (
          <>
            <UserSettings
              userId={user.sub}
              onUpdateSuccess={handleUserUpdate}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App

