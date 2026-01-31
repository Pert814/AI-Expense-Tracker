import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 初始化時檢查 localStorage 是否有使用者資訊
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  if (!user) {
    return <Login onLoginSuccess={(userData) => setUser(userData)} />
  }

  return (
    <div className="app-container">
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#eee' }}>
        <span>你好, {user.name}</span>
        <button onClick={handleLogout}>登出</button>
      </nav>

      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>歡迎來到 AI 收支管理系統</h1>
        <p>你的 Email: {user.email}</p>
        <div className="card">
          <p>這裡之後會顯示你的收支圖表與紀錄</p>
        </div>
      </main>
    </div>
  )
}

export default App

