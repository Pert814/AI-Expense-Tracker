import { useState, useRef, useEffect } from 'react';
import { createWorker } from 'tesseract.js';

// 收據掃描元件(使用 Tesseract.js OCR)
function ReceiptScanner({ onTextExtracted, onClose }){
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // 開啟相機
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment"
                    }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera error:", err);
                if (err.name === 'NotAllowedError') {
                    setError("無法存取相機。請在瀏覽器設定中允許權限。");
                } else {
                    setError("無法啟動相機: " + err.message);
                }
            }
        };
        startCamera();

        // streamRef狀態為空時，關閉相機
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 擷取畫面並用 OCR worker 解析圖片內容
    const handleCapture = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        setIsScanning(true);
        setError(null);

        try {
        // 建立 OCR worker(先只用繁中跟英文)
        const worker = await createWorker(['chi_tra', 'eng']);
        // 對 canvas 上的圖片做文字辨識
        const { data: { text } } = await worker.recognize(canvas);
        await worker.terminate();

        // 判斷有沒有辨識到文字
        if (!text || !text.trim()) {
            setError('NO TEXT DETECTED. PLEASE TRY AGAIN WITH BETTER LIGHTING.');
            setIsScanning(false);
            return;
        }
        onTextExtracted(text);
        } catch (err) {
        console.error('OCR failed:', err);
        setError('SCAN FAILED. PLEASE TRY AGAIN.');
        setIsScanning(false);
        }
    };

    // 畫面元素
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'black',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {error ? (
                <div className="pixel-border" style={{ background: 'white', padding: '2rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', marginBottom: '1rem' }}>{error}</p>
                    <button className="pixel-button" onClick={onClose} style={{ fontSize: '0.6rem' }}>
                        CLOSE
                    </button>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ maxWidth: '100%', maxHeight: '80vh' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {isScanning && (
                        <p style={{
                            fontSize: '0.55rem',
                            color: 'white',
                            textAlign: 'center',
                            marginTop: '15px',
                            padding: '0 1rem',
                            lineHeight: 1.6
                        }}>
                            ⚠️ PLEASE HOLD STILL WHILE SCANNING...
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                        <button
                            className="pixel-button"
                            onClick={onClose}
                            style={{ fontSize: '0.6rem' }}
                        >
                            CANCEL
                        </button>
                        <button
                            className="pixel-button primary"
                            onClick={handleCapture}
                            disabled={isScanning}
                            style={{ fontSize: '0.6rem' }}
                        >
                            {isScanning ? 'SCANNING...' : '📷 SCAN'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default ReceiptScanner;
