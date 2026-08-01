import { useState } from 'react';
import { expenseService } from '../services/api';
import { useExpenses } from '../context/ExpenseContext';
import ReceiptScanner from './ReceiptScanner';
import ExpenseReviewForm from './ExpenseReviewForm';

// Scan頁面
function Scan({ user }) {
    const { addExpense } = useExpenses();
    const [showScanner, setShowScanner] = useState(false);
    const [parsedExpense, setParsedExpense] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // 處理 OCR 解析後的文字後傳送給AI進行分析
    const handleTextExtracted = async (text) => {
        setShowScanner(false);
        setLoading(true);
        setError(null);

        // 在 log 裡 console 掃描的文字
        console.log('--- SCANNED TEXT ---');
        console.log(text);
        console.log('--------------------');

        // 發送 OCR 提取的文字到 API 進行 AI 分析
        try {
            const response = await expenseService.parse(text);
            if (response.data.status === 'success') {
                setParsedExpense(response.data.data);
            } else {
                setError('AI COULD NOT PARSE THIS RECEIPT. PLEASE TRY AGAIN.');
            }
        } catch (err) {
            console.error('Receipt parsing error:', err);
            setError('AI PARSING FAILED. PLEASE TRY AGAIN.');
        } finally {
            setLoading(false);
        }
    };

    // 儲存 AI 分析後的支出
    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            await addExpense(parsedExpense);
            setParsedExpense(null);
        } catch (err) {
            console.error('Saving scanned receipt failed:', err);
            setError('FAILED TO SAVE RECORD.');
        } finally {
            setSaving(false);
        }
    };

    // 未登入不給用
    if (!user) {
        return (
            <div className="pixel-border" style={{ maxWidth: '600px', margin: '20px auto', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', margin: 0 }}>🔒 LOGIN TO SCAN RECEIPTS WITH AI.</p>
            </div>
        );
    }

    // 渲染畫面
    return (
        <div className="pixel-border" style={{ maxWidth: '600px', margin: '20px auto' }}>
            {!parsedExpense && !loading && (
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6rem', lineHeight: 1.8, marginBottom: '1.5rem', color: 'var(--pixel-gray)' }}>
                        CAPTURE A RECEIPT. OCR TEXT WILL BE SENT TO AI AUTOMATICALLY.
                    </p>
                    <button
                        className="pixel-button primary"
                        onClick={() => setShowScanner(true)}
                        style={{ margin: 0 }}
                    >
                        📷 START SCAN
                    </button>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="pixel-loader" />
                    <p style={{ fontSize: '0.6rem', marginTop: '1rem' }}>AI ANALYZING RECEIPT...</p>
                </div>
            )}

            {parsedExpense && (
                <ExpenseReviewForm
                    expense={parsedExpense}
                    onChange={setParsedExpense}
                    onCancel={() => setParsedExpense(null)}
                    onConfirm={handleSave}
                    saving={saving}
                    cancelLabel="SCAN AGAIN"
                />
            )}

            {error && <p style={{ color: 'var(--pixel-danger)', marginTop: '15px', fontSize: '0.6rem', textAlign: 'center' }}>{error}</p>}

            {showScanner && (
                <ReceiptScanner
                    onTextExtracted={handleTextExtracted}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}

export default Scan;
