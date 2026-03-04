function LoadingScreen({ text = "SYSTEM LOADING..." }) {
    return (
        <div className="loading-overlay">
            <div className="pixel-spinner-large"></div>
            <div className="loading-text">
                {text}
            </div>
            <div style={{ marginTop: '30px', fontSize: '0.4rem', color: 'var(--pixel-gray)' }}>
                PLEASE WAIT UNTIL DATA UPLOAD COMPLETE...
            </div>
        </div>
    );
}

export default LoadingScreen;
