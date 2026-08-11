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
    const question = message.trim();
    if (!question || isSending) return;

    setIsSending(true);
    setError('');
    try {
      // Send the whole completed history, then add this new Q&A only after Gemini replies.
      const response = await expenseService.chat(question, history);
      const answer = response.data?.answer;
      if (!answer) throw new Error('No answer was returned.');

      setHistory((previous) => [
        ...previous,
        { role: 'user', content: question },
        { role: 'assistant', content: answer },
      ]);
      setMessage('');
    } catch (err) {
      console.error('Expense chat failed:', err);
      setError(err.response?.data?.detail || 'Unable to answer right now. Please try again.');
    } finally {
      setIsSending(false);
    }
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

      <form className="expense-chat-form" onSubmit={sendMessage}>
        <label htmlFor="expense-chat-input">YOUR QUESTION</label>
        <textarea
          id="expense-chat-input"
          className="pixel-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="例如：幫我看看最近的餐飲支出..."
          rows="3"
          disabled={isSending}
        />
        {error && <p className="expense-chat-error">{error}</p>}
        <div className="expense-chat-submit">
          <button className="pixel-button primary" type="submit" disabled={!message.trim() || isSending}>
            {isSending ? 'THINKING...' : 'SEND'}
          </button>
        </div>
      </form>
    </div>
  );
}
