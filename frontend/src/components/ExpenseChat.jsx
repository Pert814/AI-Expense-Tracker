import { useEffect, useRef, useState } from 'react';
import { expenseService } from '../services/api';
// 聊天介面
const historyKey = (userId) => `expense-chat-history:${userId}`;

function readHistory(userId) {
  try {
    const saved = localStorage.getItem(historyKey(userId));
    const history = saved ? JSON.parse(saved) : [];
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

export default function ExpenseChat({ user }) {
  const [history, setHistory] = useState(() => readHistory(user.id));
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setHistory(readHistory(user.id));
    setMessage('');
    setError('');
  }, [user.id]);

  useEffect(() => {
    localStorage.setItem(historyKey(user.id), JSON.stringify(history));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, user.id]);

  const sendMessage = async (event) => {
    event.preventDefault();
    // Chat feature is temporarily disabled for maintenance.
    return;
  };

  const clearHistory = () => {
    if (!history.length || window.confirm('CLEAR THIS CHAT HISTORY?')) {
      setHistory([]);
      localStorage.removeItem(historyKey(user.id));
    }
  };

  return (
    <div className="expense-chat pixel-border">
      <div className="expense-chat-header">
        <div>
          <h1>EXPENSE ASSISTANT</h1>
          <p>ASK ABOUT YOUR SAVED EXPENSES, SPENDING PATTERNS, OR BUDGET.</p>
        </div>
      </div>

      <div className="expense-chat-messages" aria-live="polite">
        {history.length === 0 && (
          <div className="expense-chat-empty">
            NO CHAT LOG YET. TRY:「我這個月花最多在哪個類別？」
          </div>
        )}
        {history.map((entry, index) => (
          <div key={`${entry.role}-${index}`} className={`expense-chat-message ${entry.role}`}>
            <span className="expense-chat-role">{entry.role === 'user' ? 'YOU' : 'AI'}</span>
            <p>{entry.content}</p>
          </div>
        ))}
        {isSending && (
          <div className="expense-chat-message assistant">
            <span className="expense-chat-role">AI</span>
            <p>ANALYZING YOUR EXPENSE LOG...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
        <button
          className="pixel-button danger expense-chat-clear"
          type="button"
          onClick={clearHistory}
          disabled={!history.length || isSending}
        >
          CLEAR LOG
        </button>
      </div>

      <div 
        className="pixel-border" 
        style={{ 
          borderColor: 'var(--pixel-warning)', 
          background: '#fffdf0', 
          marginBottom: '1.5rem', 
          padding: '1rem',
          textAlign: 'left'
        }}
      >
        <p style={{ margin: 0, color: 'var(--pixel-dark)', fontWeight: 'bold', fontSize: '0.7rem' }}>
          ⚠️ 系統公告 / SYSTEM NOTICE
        </p>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--pixel-dark)', fontSize: '0.6rem', lineHeight: '1.6' }}>
          對不起，AI 記帳助理功能目前正在維護中，暫時關閉輸入。
          我們會盡快修復此功能，感謝您的耐心與體諒！
          <br />
          <span style={{ opacity: 0.8 }}>
            Sorry, the AI chat assistant is currently undergoing maintenance. Text input is temporarily disabled. We will restore it as soon as possible!
          </span>
        </p>
      </div>

      <form className="expense-chat-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="expense-chat-input" style={{ color: 'var(--pixel-gray)' }}>YOUR QUESTION (TEMPORARILY DISABLED)</label>
        <textarea
          id="expense-chat-input"
          className="pixel-input"
          value=""
          readOnly
          placeholder="功能維護中，暫時無法輸入... (Maintenance in progress...)"
          rows="3"
          disabled={true}
          style={{ cursor: 'not-allowed', backgroundColor: '#f0f0f0', color: 'var(--pixel-gray)' }}
        />
        <div className="expense-chat-submit">
          <button 
            className="pixel-button primary" 
            type="button" 
            disabled={true} 
            style={{ cursor: 'not-allowed', opacity: 0.6, background: 'var(--pixel-gray)' }}
          >
            MAINTENANCE
          </button>
        </div>
      </form>
    </div>
  );
}
