import { getAvailableCurrencies } from '../services/guestStorage';

// 因為 ExpenseInput 跟 ExpenseScanner 都需要,故單獨拉出來做成元件
function ExpenseReviewForm({ expense, onChange, onCancel, onConfirm, saving = false, cancelLabel = 'RE-EDIT' }) {
    const currencyOptions = [...new Set([
        ...getAvailableCurrencies(),
        expense.currency
    ].filter(Boolean))];

    // 修改頁面的欄位內容函式
    const handleChange = (field, value) => {
        onChange({ ...expense, [field]: value });
    };

    // 渲染頁面 
    return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <h4 style={{ fontSize: '0.7rem', color: 'var(--pixel-secondary)', marginBottom: '15px' }}>
                PLEASE REVIEW AND CONFIRM:
            </h4>

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
                    <input
                        className="pixel-input"
                        style={{ marginBottom: 0 }}
                        value={expense.category ?? ''}
                        onChange={(event) => handleChange('category', event.target.value)}
                    />
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
                <button
                    type="button"
                    className="pixel-button success"
                    onClick={onConfirm}
                    disabled={saving}
                    style={{ flex: 2, margin: 0 }}
                >
                    {saving ? 'SAVING...' : 'CONFIRM & SAVE'}
                </button>
            </div>
        </div>
    );
}

export default ExpenseReviewForm;
