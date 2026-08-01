import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import ExpenseInput from './components/ExpenseInput'
import ExpenseList from './components/ExpenseList'
import DailyExpenses from './components/DailyExpenses'
import UserSettings from './components/UserSettings'
import ExpenseAnalysis from './components/ExpenseAnalysis'
import Scan from './components/Scan'
import { userService, expenseService } from './services/api'
import { guestExpenseService } from './services/guestStorage';
import LoadingScreen from './components/LoadingScreen'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { ExpenseProvider, useExpenses } from './context/ExpenseContext'
import { auth } from './firebase'
import { signOut } from 'firebase/auth'

// 整個app從這裡開始定義
function App() {
  // 從localStorage讀使用者資料 或者 宣告成null
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  // 宣告驗證狀態(firebase),初始為false
  const [authReady, setAuthReady] = useState(false);

  // 監聽登入狀態來更新驗證狀態
  useEffect(() => {
    // auth.onAuthStateChanged是一個監聽器函式，它會監聽firebase的登入狀態
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      // 監聽到結果,設定setAuthReady為true
      setAuthReady(true);
      if (firebaseUser) {
        // 設定firebaseUser至user state中
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        // 如果firebase中找不到user（或登出），清除user state
        const saved = localStorage.getItem('user');
        if (saved) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 輸出畫面(JSX)並作為props傳入user state和authReady
  return (
    <ExpenseProvider user={user} authReady={authReady}>
      <AppContent user={user} setUser={setUser} authReady={authReady} />
    </ExpenseProvider>
  )
}

// 定義如何渲染主介面的AppContent（主內容）
function AppContent({ user, setUser, authReady }) {
  const [userInfo, setUserInfo] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentView, setCurrentView] = useState('home') // 'home', 'stats', 'daily', or 'settings'
  const [isDataLoading, setIsDataLoading] = useState(false)
  const { fetchExpenses, expenses } = useExpenses()

  // PWA 的狀態，用來監聽新版本的更新
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('[PWA] Service Worker registered:', swUrl);
      // 設定每小時檢查一次新版本
      registration && setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); 
    },
    // 如果註冊失敗，console在伺服器
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  })

  // 監聽user狀態，authReady的變化去獲取userinfo(config)
  useEffect(() => {
    if (user && authReady) {
      const initLoad = async () => {
        setIsDataLoading(true);
        await fetchUserInfo();
        setIsDataLoading(false);
      }
      initLoad();
    } else {
      setUserInfo(null)
    }
  }, [user, authReady])

  // 獲取userinfo(config)函式
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

  // logout 函式
  const handleLogout = async () => {
    // 確認提示窗
    if (!window.confirm('ARE YOU SURE YOU WANT TO LOG OUT?')) return;

    //firebase 登出,前述的unsubscribe會自動監聽到登出狀態並觸發移除localstorage中的user和token
    try {
        await signOut(auth);
    } catch (err) {
        console.error('Firebase sign out failed:', err);
    }
    // 重置user state
    setUser(null)
    setUserInfo(null)
  }

  // update user info函式
  const handleUserUpdate = (updatedInfo) => {
    setUserInfo(updatedInfo)
  }

  // sync guest data to cloud函式
  const syncGuestDataToCloud = async () => {
    const guestData = guestExpenseService.getAll();
    if (guestData.length === 0) return;

    const confirmed = window.confirm(
        `FOUND ${guestData.length} LOCAL RECORD(S). SYNC TO YOUR ACCOUNT?`
    );
    if (!confirmed) return;

    let successCount = 0;
    const failedRecords = [];

    for (const record of guestData) {
        try {
            const { id, createdAt, ...payload } = record; // 去掉本機專用欄位
            const response = await expenseService.create(payload);
            if (response.data.status === 'success') {
                successCount++;
            } else {
                failedRecords.push(record);
            }
        } catch (err) {
            console.error('Sync failed for record:', record, err);
            failedRecords.push(record);
        }
    }

    if (failedRecords.length === 0) {
        // 全部成功才清空本機資料
        guestExpenseService.clear();
        alert(`SYNCED ${successCount} RECORD(S) SUCCESSFULLY.`);
    } else {
        alert(`SYNCED ${successCount}, FAILED ${failedRecords.length}. FAILED RECORDS KEPT LOCALLY, TRY AGAIN LATER.`);
    }

    // Refresh context data
    await fetchExpenses();
  };

  // showing loading screen if isDataLoading or (user and not authReady)
  const showGlobalLoading = isDataLoading || (user && !authReady);

  // 輸出畫面(JSX)
  return (
    <div className="app-wrapper">
      {needRefresh && (
          <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.9)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
          }}>
              <div className="pixel-border" style={{
                  background: 'white',
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  maxWidth: '400px'
              }}>
                  <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--pixel-primary)' }}>
                      🆕 NEW VERSION AVAILABLE
                  </h2>
                  <p style={{ fontSize: '0.6rem', marginBottom: '2rem', lineHeight: '1.8', color: 'var(--pixel-gray)' }}>
                      AN UPDATE IS READY. PLEASE REFRESH TO CONTINUE.
                  </p>
                  <button
                      className="pixel-button primary"
                      onClick={() => updateServiceWorker(true)}
                      style={{ width: '100%', margin: 0, fontSize: '0.7rem', padding: '0.8rem' }}
                  >
                      UPDATE NOW
                  </button>
              </div>
          </div>
      )}
      {showGlobalLoading && <LoadingScreen text={isDataLoading ? "SYNCING DATA..." : "INITIALIZING SYSTEM..."} />}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: 0,
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <Login onLoginSuccess={(userData) => {
              setUser(userData)
              setShowLoginModal(false)
              syncGuestDataToCloud()
            }} />
          </div>
        </div>
      )}
      <header className="app-header">
        <div className="logo">
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', lineHeight: '1.2', display: 'block', textAlign: 'center' }}>
            AI<br />
            Expense<br />
            Tracker
          </span>
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
            className={`pixel-button ${currentView === 'scan' ? 'primary' : ''}`}
            onClick={() => setCurrentView('scan')}
            style={{ fontSize: '0.6rem' }}
          >
            SCAN
          </button>
          <button
              className={`pixel-button ${currentView === 'stats' ? 'primary' : ''}`}
              onClick={() => user ? setCurrentView('stats') : setShowLoginModal(true)}
              title={!user ? 'LOGIN REQUIRED' : undefined}
              style={{ fontSize: '0.6rem', opacity: user ? 1 : 0.5 }}
          >
              STATS{!user && ' 🔒'}
          </button>
          <button
              className={`pixel-button ${currentView === 'daily' ? 'primary' : ''}`}
              onClick={() => user ? setCurrentView('daily') : setShowLoginModal(true)}
              title={!user ? 'LOGIN REQUIRED' : undefined}
              style={{ fontSize: '0.6rem', opacity: user ? 1 : 0.5 }}
          >
              LOGS{!user && ' 🔒'}
          </button>
          <button
              className={`pixel-button ${currentView === 'settings' ? 'primary' : ''}`}
              onClick={() => setCurrentView('settings')}
              style={{ fontSize: '0.6rem' }}
          >
              CONFIG
          </button>
          {user ? (
            <button className="pixel-button danger" onClick={handleLogout} style={{ fontSize: '0.6rem' }}>
              EXIT
            </button>
          ) : (
            <button className="pixel-button primary" onClick={() => setShowLoginModal(true)} style={{ fontSize: '0.6rem' }}>
              LOGIN
            </button>
          )}
        </nav>
      </header>

      {/* User Status Bar */}
      <div style={{ background: '#eee', padding: '5px 20px', display: 'flex', justifyContent: 'flex-end', fontSize: '0.5rem', borderBottom: '2px solid #ccc' }}>
        <span>PLAYER: {userInfo?.name || user?.name || 'GUEST'}</span>
      </div>

      <main className="pixel-container">
        {currentView === 'home' && (
          <div className="view-home">
            <section style={{ marginBottom: '3rem' }}>
              <ExpenseInput
                userInfo={userInfo}
                user={user}
              />
            </section>

            <section>
              <h2 style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--pixel-gray)', marginBottom: '1.5rem' }}>RECENT ACTIVITY</h2>
              <ExpenseList user={user} />
            </section>
          </div>

        )}

        {currentView === 'scan' && (
            <div className="view-scan">
                <h1 className="pixel-border" style={{ textAlign: 'center', background: 'var(--pixel-primary)', color: 'white', fontSize: '1rem' }}>
                    SCAN RECEIPT
                </h1>
                <Scan user={user} />
            </div>
        )}

        {currentView === 'stats' && (
          <ExpenseAnalysis userInfo={userInfo} />
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
            <UserSettings onUpdateSuccess={handleUserUpdate} user={user} />
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', fontSize: '0.5rem', color: 'var(--pixel-gray)' }}>
        AI-XPNS TRACKER v1.0 // NOSTALGIC EDITION<br />
        © 2026 CHIEN YU-HSUAN. ALL RIGHTS RESERVED.
      </footer>
    </div>
  )
}

export default App
