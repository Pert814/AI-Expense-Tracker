import { useState, useRef } from 'react';   
import { expenseService } from '../services/api';
import { useExpenses } from '../context/ExpenseContext';
import ExpenseReviewForm from './ExpenseReviewForm';

function ExpenseInput({ userInfo, user }) {
    const isGuest = !user;
    const { addExpense } = useExpenses();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [parsedExpenses, setParsedExpenses] = useState(null);
    const [error, setError] = useState(null);
    const [isListening, setIsListening] = useState(false);

    // 定義語音輸入的 useRef 來存語音辨識物件
    const recognitionRef = useRef(null);

    // 切換語音聆聽狀態的函式（目前是用繁體中文zh-TW)
    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setError('BROWSER NOT SUPPORTED VOICE.');
                return;
            }
            
            setError(null);
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.lang = 'zh-TW'; // Default to Traditional Chinese
            rec.interimResults = false;

            rec.onstart = () => {
                setIsListening(true);
            };
            rec.onend = () => {
                setIsListening(false);
                recognitionRef.current = null;
            };
            rec.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setError('VOICE ERROR: ' + event.error.toUpperCase());
                setIsListening(false);
                recognitionRef.current = null;
            };
            rec.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setText(transcript);
            };

            recognitionRef.current = rec;
            try {
                rec.start();
            } catch (err) {
                console.error('Failed to start speech recognition:', err);
                setError('FAILED TO START VOICE INPUT.');
                setIsListening(false);
                recognitionRef.current = null;
            }
        }
    };

    // 叫用後端AI辨識
    const handleParse = async (e) => {
        if (e) e.preventDefault();
        if (!text.trim() || isGuest) return;

        setLoading(true);
        setError(null);
        setParsedExpenses(null);

        try {
            const response = await expenseService.parse(text);
            if (response.data.status === 'success') {
                const data = response.data.data;
                setParsedExpenses(Array.isArray(data) ? data : [data]);
            }
        } catch (err) {
            console.error('Parsing error:', err);
            setError('AI parsing failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // 存入資料庫函式
    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            await addExpense(parsedExpenses);
            setText('');
        } catch (err) {
            console.error('Saving error:', err);
            setError('Failed to save record.');
        } finally {
            setSaving(false);
        }
    };

    // 定義AI能否使用狀態
    const isAiDisabled = loading || !text || isGuest;

    // 版面配置
    return (
        <div style={{ maxWidth: '600px', margin: '20px auto' }}>
            <div className="pixel-border">
                <h3 style={{ marginBottom: '15px', fontSize: '0.9rem' }}>NEW TRANSACTION</h3>

                {!parsedExpenses ? (
                    <form onSubmit={handleParse}>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                className="pixel-input"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="E.G. I bought a coffee for 150 today"
                                style={{ minHeight: '200px', resize: 'none' }}
                                disabled={loading || isListening}
                            />
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`voice-button ${isListening ? 'listening' : ''}`}
                                title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
                                    {/* Mic Head */}
                                    <rect x="8" y="2" width="8" height="10" />
                                    <rect x="10" y="4" width="1" height="1" fill={isListening ? 'var(--pixel-danger)' : 'white'} />
                                    <rect x="13" y="4" width="1" height="1" fill={isListening ? 'var(--pixel-danger)' : 'white'} />
                                    <rect x="10" y="7" width="1" height="1" fill={isListening ? 'var(--pixel-danger)' : 'white'} />
                                    <rect x="13" y="7" width="1" height="1" fill={isListening ? 'var(--pixel-danger)' : 'white'} />
                                    
                                    {/* U-Stand */}
                                    <rect x="5" y="10" width="2" height="6" />
                                    <rect x="17" y="10" width="2" height="6" />
                                    <rect x="7" y="14" width="10" height="2" />
                                    
                                    {/* Base */}
                                    <rect x="11" y="16" width="2" height="3" />
                                    <rect x="8" y="19" width="8" height="2" />
                                </svg>
                            </button>
                            {isListening && (
                                <div className="listening-indicator" style={{ pointerEvents: 'auto' }}>
                                    <div>
                                        <span className="dot"></span> LISTENING...
                                    </div>
                                    <button
                                        type="button"
                                        className="pixel-button danger"
                                        onClick={toggleListening}
                                        style={{
                                            marginTop: '15px',
                                            padding: '8px 16px',
                                            fontSize: '0.75rem',
                                            margin: '0',
                                            cursor: 'pointer',
                                            zIndex: 20
                                        }}
                                    >
                                        STOP SPEAKING
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className="pixel-button primary"
                            type="submit"
                            disabled={isAiDisabled}
                            title={isGuest ? 'LOGIN REQUIRED TO USE AI PARSING' : undefined}
                            style={{
                                width: '100%',
                                margin: '0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                background: isAiDisabled ? '#555' : undefined,
                                color: isAiDisabled ? '#aaa' : undefined,
                                cursor: isAiDisabled ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? (
                                <>
                                    <div className="pixel-loader" style={{ width: '14px', height: '14px', border: '2px solid white' }}></div>
                                    AI ANALYZING...
                                </>
                            ) : isGuest ? '🔒 LOGIN TO USE AI' : 'SENT TO AI'}
                        </button>
                        <p style={{ fontSize: '0.5rem', marginTop: '10px', color: 'var(--pixel-gray)' }}>
                            USE NATURAL LANGUAGE. AI WILL EXTRACT DETAILS.
                        </p>
                    </form>
                ) : (
                    <ExpenseReviewForm
                        expenses={parsedExpenses}
                        onChange={setParsedExpenses}
                        onCancel={() => setParsedExpenses(null)}
                        onConfirm={handleSave}
                        saving={saving}
                    />
                )}

                {error && <p style={{ color: 'var(--pixel-danger)', marginTop: '15px', fontSize: '0.6rem', textAlign: 'center' }}>{error}</p>}
            </div>

            {/* Manual Entry Button Below Border */}
            {!parsedExpenses && (
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <button
                        type="button"
                        className="pixel-button"
                        onClick={() => setParsedExpenses([{
                            item: '',
                            category: userInfo?.categories?.[0] || 'Food',
                            amount: '',
                            currency: userInfo?.currency || 'JPY',
                            date: new Date().toISOString().split('T')[0]
                        }])}
                        style={{ width: '100%', margin: '0' }}
                    >
                        BYPASS AI: MANUAL ENTRY
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExpenseInput;
