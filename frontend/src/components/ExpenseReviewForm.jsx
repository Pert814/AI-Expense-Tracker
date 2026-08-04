import { useState } from 'react';
import { getAvailableCurrencies } from '../services/guestStorage';

// 因為 ExpenseInput 跟 ExpenseScanner 都需要,故單獨拉出來做成元件
function ExpenseReviewForm({ expenses, onChange, onCancel, onConfirm, saving = false, cancelLabel = 'RE-EDIT', categories = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState(null);
    const expense = expenses[currentIndex];
    const isLastItem = currentIndex === expenses.length - 1;
    const isMultiple = expenses.length > 1;
    const currencyOptions = [...new Set([
        ...getAvailableCurrencies(),
        expense.currency
    ].filter(Boolean))];

    // 修改頁面的欄位內容函式
    const handleChange = (field, value) => {
        const updated = expenses.map((item, idx) =>
            idx === currentIndex ? { ...item, [field]: value } : item
        );
        onChange(updated);
    };

    // 手指碰到螢幕的瞬間，記錄起始位置
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    // 手指離開螢幕時，判斷滑動方向
    const handleTouchEnd = (e) => {
        if (touchStartX === null || !isMultiple) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        const SWIPE_THRESHOLD = 50; // 至少滑動 50px 才算有效滑動，避免手抖誤觸

        if (diff > SWIPE_THRESHOLD) {
            // 往左滑：切到下一筆（如果還有下一筆）
            setCurrentIndex(prev => Math.min(expenses.length - 1, prev + 1));
        } else if (diff < -SWIPE_THRESHOLD) {
            // 往右滑：切回上一筆
            setCurrentIndex(prev => Math.max(0, prev - 1));
        }

        setTouchStartX(null);
    };

    // 渲染頁面 
    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ animation: 'fadeIn 0.3s' }}
        >
            <h4 style={{ fontSize: '0.7rem', color: 'var(--pixel-secondary)', marginBottom: '15px' }}>
                PLEASE REVIEW AND CONFIRM:
            </h4>

            {isMultiple && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '15px' }}>
                    {expenses.map((_, idx) => (
                        <span
                            key={idx}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: idx === currentIndex ? 'var(--pixel-primary)' : 'var(--pixel-gray)',
                                display: 'inline-block'
                            }}
                        />
                    ))}
                </div>
            )}

            {isMultiple && (
                <p style={{ fontSize: '0.55rem', textAlign: 'center', color: 'var(--pixel-gray)', marginBottom: '15px' }}>
                    ITEM {currentIndex + 1} / {expenses.length} — SWIPE TO NAVIGATE
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div>
                    <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>ITEM</label>
                    <input
                        className="pixel-input"
                        style={{ marginBottom: 0 }}
                        value={expense.item ?? ''}
                        onChange={(event) => handleChange('item', event.target.value)}
                    />
                </div>  
                <div>
                    <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>CATEGORY</label>
                    <select
                        className="pixel-input"
                        style={{ marginBottom: 0 }}
                        value={expense.category ?? ''}
                        onChange={(event) => handleChange('category', event.target.value)}
                    >
                        {/* 防呆：如果目前的分類不在使用者的分類清單裡（例如舊資料、AI 判斷出清單外的分類），
                            額外補一個選項讓它不會憑空消失，使用者還是看得到、能重新選擇 */}
                        {expense.category && !categories.includes(expense.category) && (
                            <option value={expense.category}>{expense.category}</option>
                        )}
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>AMOUNT</label>
                    <input
                        className="pixel-input"
                        style={{ marginBottom: 0 }}
                        type="number"
                        value={expense.amount ?? ''}
                        onChange={(event) => handleChange('amount', event.target.value)}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>CURRENCY</label>
                    <select
                        className="pixel-input"
                        style={{ marginBottom: 0 }}
                        value={expense.currency || currencyOptions[0] || ''}
                        onChange={(event) => handleChange('currency', event.target.value)}
                    >
                        {currencyOptions.map(currency => (
                            <option key={currency} value={currency}>{currency}</option>
                        ))}
                    </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>DATE</label>
                    <input
                        className="pixel-input"
                        style={{ marginBottom: 0 }}
                        type="date"
                        value={expense.date ?? ''}
                        onChange={(event) => handleChange('date', event.target.value)}
                    />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.5rem', display: 'block', marginBottom: '5px' }}>NOTE</label>
                    <textarea
                        className="pixel-input"
                        style={{ marginBottom: 0, minHeight: '60px', resize: 'none' }}
                        value={expense.note ?? ''}
                        onChange={(event) => handleChange('note', event.target.value)}
                    />
                </div>
            </div>

           <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    type="button"
                    className="pixel-button"
                    onClick={onCancel}
                    style={{ flex: 1, margin: 0 }}
                >
                    {cancelLabel}
                </button>

                {isMultiple && !isLastItem ? (
                    <button
                        type="button"
                        className="pixel-button primary"
                        onClick={() => setCurrentIndex(prev => Math.min(expenses.length - 1, prev + 1))}
                        style={{ flex: 2, margin: 0 }}
                    >
                        NEXT ▶
                    </button>
                ) : (
                    <button
                        type="button"
                        className="pixel-button success"
                        onClick={onConfirm}
                        disabled={saving}
                        style={{ flex: 2, margin: 0 }}
                    >
                        {saving
                            ? 'SAVING...'
                            : isMultiple
                                ? `CONFIRM & SAVE ALL (${expenses.length})`
                                : 'CONFIRM & SAVE'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ExpenseReviewForm;
