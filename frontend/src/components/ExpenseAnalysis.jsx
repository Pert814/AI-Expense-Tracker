import React from 'react';

function ExpenseAnalysis({ summary, userInfo }) {
    if (!summary || !summary.categories) {
        return <div className="pixel-border" style={{ textAlign: 'center' }}>NO DATA TO ANALYZE.</div>;
    }

    return (
        <div className="view-stats">
            <h1 className="pixel-border" style={{ textAlign: 'center', background: '#4b0082', color: 'white', fontSize: '1rem' }}>
                DATA ANALYSIS
            </h1>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-danger)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>TOTAL BUDGET USED</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-danger)', fontSize: '1.2rem' }}>{summary.total}</h2>
                </div>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-primary)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>MAIN CURRENCY</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-primary)', fontSize: '1.2rem' }}>{userInfo?.currency || 'TWD'}</h2>
                </div>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-success)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>TOTAL TRANSACTIONS</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-success)', fontSize: '1.2rem' }}>{summary.count}</h2>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="pixel-border" style={{ background: 'white', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.7rem', marginBottom: '25px', color: 'var(--pixel-dark)' }}>SPENDING BY CATEGORY</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {summary.categories.map(([cat, val]) => {
                        const percentage = Math.round((val / (parseFloat(summary.total) || 1)) * 100);
                        return (
                            <div key={cat}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{cat.toUpperCase()}</span>
                                    <span>{parseFloat(val).toFixed(0)} {userInfo?.currency} ({percentage}%)</span>
                                </div>
                                <div style={{ height: '16px', background: '#f0f0f0', border: '3px solid #212529', position: 'relative' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(100, percentage)}%`,
                                        background: 'var(--pixel-primary)',
                                        boxShadow: 'inset -4px 0 0 rgba(0,0,0,0.2)'
                                    }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Performance Tip */}
            <div className="pixel-border" style={{ background: 'var(--pixel-bg-overlay)', fontSize: '0.6rem', color: '#666', lineHeight: '1.6' }}>
                <p>💡 TIP: USE THE CONFIG MENU TO ADD MORE CATEGORIES FOR BETTER GRANULARITY IN YOUR ANALYSIS.</p>
            </div>
        </div>
    );
}

export default ExpenseAnalysis;
