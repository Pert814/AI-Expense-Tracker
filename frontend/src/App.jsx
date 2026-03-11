import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import ExpenseInput from './components/ExpenseInput'
import ExpenseList from './components/ExpenseList'
import DailyExpenses from './components/DailyExpenses'
import UserSettings from './components/UserSettings'
import ExpenseAnalysis from './components/ExpenseAnalysis'
import { userService, expenseService } from './services/api'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentView, setCurrentView] = useState('home') // 'home', 'stats', 'daily', or 'settings'
  const [summary, setSummary] = useState({ total: 0, count: 0 })
  const [isDataLoading, setIsDataLoading] = useState(false)

  // check localStorage for user info
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  // Fetch detailed user info (categories, currency)
  useEffect(() => {
    if (user) {
      const initLoad = async () => {
        setIsDataLoading(true);
        const info = await fetchUserInfo();
        await fetchSummary(info?.stats_start_date);
        setIsDataLoading(false);
      }
      initLoad();
    }
  }, [user, refreshTrigger])

  const fetchUserInfo = async () => {
    try {
      const response = await userService.getInfo()
      if (response.data.status === 'success') {
        const data = response.data.data
        setUserInfo(data)
        return data
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err)
      return null
    }
  }

  const fetchSummary = async (providedStartDate = null) => {
    try {
      const response = await expenseService.getAll()
      if (response.data.status === 'success') {
        let data = response.data.data

        // Use provided start date or fallback to current userInfo state
        const startDateStr = providedStartDate || userInfo?.stats_start_date;

        if (startDateStr) {
          const startDate = new Date(startDateStr);
          data = data.filter(item => {
            if (!item.date) return false;
            const itemDate = new Date(item.date);
            return itemDate >= startDate;
          });
        }

        const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

        // Calculate category distribution
        const cats = {}
        data.forEach(item => {
          cats[item.category] = (cats[item.category] || 0) + (parseFloat(item.amount) || 0)
        })

        setSummary({
          total: total.toFixed(2),
          count: data.length,
          categories: Object.entries(cats).sort((a, b) => b[1] - a[1])
        })
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

  // logout function 
  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setUserInfo(null)
  }

  // update user info in state
  const handleUserUpdate = (updatedInfo) => {
    setUserInfo(updatedInfo)
    fetchSummary(updatedInfo?.stats_start_date)
  }

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />
  }

  return (
    <div className="app-wrapper">
      {isDataLoading && <LoadingScreen text="SYNCING DATA..." />}
      <header className="app-header">
        <div className="logo">
          <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>AI-BANK</span>
        </div>
        <nav className="nav-links">
          <button
            className={`pixel-button ${currentView === 'home' ? 'primary' : ''}`}
            onClick={() => setCurrentView('home')}
            style={{ fontSize: '0.6rem' }}
          >
            ENTRY
          </button>
          <button
            className={`pixel-button ${currentView === 'stats' ? 'primary' : ''}`}
            onClick={() => setCurrentView('stats')}
            style={{ fontSize: '0.6rem' }}
          >
            STATS
          </button>
          <button
            className={`pixel-button ${currentView === 'daily' ? 'primary' : ''}`}
            onClick={() => setCurrentView('daily')}
            style={{ fontSize: '0.6rem' }}
          >
            LOGS
          </button>
          <button
            className={`pixel-button ${currentView === 'settings' ? 'primary' : ''}`}
            onClick={() => setCurrentView('settings')}
            style={{ fontSize: '0.6rem' }}
          >
            CONFIG
          </button>
          <button className="pixel-button danger" onClick={handleLogout} style={{ fontSize: '0.6rem' }}>
            EXIT
          </button>
        </nav>
      </header>

      {/* User Status Bar */}
      <div style={{ background: '#eee', padding: '5px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', borderBottom: '2px solid #ccc' }}>
        <span>PLAYER: {userInfo?.name || user.name}</span>
        <span>VAULT: {summary.total} {userInfo?.currency || 'TWD'}</span>
      </div>

      <main className="pixel-container">
        {currentView === 'home' && (
          <div className="view-home">
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{ fontSize: '1.2rem', color: 'var(--pixel-dark)' }}>READY FOR ENTRY?</h1>
              <p style={{ fontSize: '0.6rem', color: 'var(--pixel-gray)' }}>DESCRIBE YOUR SPENDING TO THE AI</p>
            </div>

            <section style={{ marginBottom: '3rem' }}>
              <ExpenseInput onSuccess={() => setRefreshTrigger(prev => prev + 1)} />
            </section>

            <section>
              <h2 style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--pixel-gray)', marginBottom: '1.5rem' }}>RECENT ACTIVITY</h2>
              <ExpenseList refreshTrigger={refreshTrigger} />
            </section>
          </div>
        )}

        {currentView === 'stats' && (
          <ExpenseAnalysis summary={summary} userInfo={userInfo} />
        )}

        {currentView === 'daily' && (
          <div className="view-daily">
            <h1 className="pixel-border" style={{ textAlign: 'center', background: 'var(--pixel-success)', color: 'white', fontSize: '1rem' }}>
              HISTORY LOG
            </h1>
            <DailyExpenses />
          </div>
        )}

        {currentView === 'settings' && (
          <div className="view-settings">
            <h1 className="pixel-border" style={{ textAlign: 'center', background: 'var(--pixel-primary)', color: 'white', fontSize: '1rem' }}>
              SYSTEM CONFIG
            </h1>
            <UserSettings onUpdateSuccess={handleUserUpdate} />
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', fontSize: '0.5rem', color: 'var(--pixel-gray)' }}>
        AI-XPNS TRACKER v1.0 // NOSTALGIC EDITION
      </footer>
    </div>
  )
}

export default App

