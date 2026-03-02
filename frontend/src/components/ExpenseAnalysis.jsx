import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

function ExpenseAnalysis({ expenses, userInfo }) {
    const [mode, setMode] = useState('month'); // 'year', 'month', 'custom'
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [customRange, setCustomRange] = useState({
        start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD')
    });

    // 1. Determine the effective range based on shifted cycle logic
    const effectiveRange = useMemo(() => {
        const statsStart = userInfo?.stats_start_date ? dayjs(userInfo.stats_start_date) : null;
        let start, end;

        if (mode === 'month') {
            if (statsStart) {
                // Shifted Month: Start from the 'day' of stats_start_date
                const targetDay = statsStart.date();
                // Create start date in the 'current' selected month/year
                start = currentDate.set('date', targetDay).startOf('day');
                // End is one day before the same day in the next month
                end = start.add(1, 'month').subtract(1, 'day').endOf('day');
            } else {
                start = currentDate.startOf('month');
                end = currentDate.endOf('month');
            }
        } else if (mode === 'year') {
            if (statsStart) {
                // Shifted Year: Start from the 'month/day' of stats_start_date
                start = currentDate.month(statsStart.month()).date(statsStart.date()).startOf('day');
                // End is one day before the same month/day in the next year
                end = start.add(1, 'year').subtract(1, 'day').endOf('day');
            } else {
                start = currentDate.startOf('year');
                end = currentDate.endOf('year');
            }
        } else {
            // Custom mode ignores shifted cycles, follows user input
            start = dayjs(customRange.start).startOf('day');
            end = dayjs(customRange.end).endOf('day');
        }

        // Global constraint: Cannot analyze data before the actual configuration start date
        if (statsStart && start.isBefore(statsStart)) {
            start = statsStart;
            if (end.isBefore(statsStart)) return null;
        }

        return { start, end };
    }, [mode, currentDate, customRange, userInfo?.stats_start_date]);

    // 2. Filter expenses
    const filteredData = useMemo(() => {
        if (!expenses || !Array.isArray(expenses) || !effectiveRange) return [];

        return expenses.filter(item => {
            const itemDate = dayjs(item.date);
            return itemDate.isBetween(effectiveRange.start, effectiveRange.end, 'day', '[]');
        });
    }, [expenses, effectiveRange]);

    // 3. Calculate summary
    const summary = useMemo(() => {
        const total = filteredData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const catMap = {};

        filteredData.forEach(item => {
            catMap[item.category] = (catMap[item.category] || 0) + (parseFloat(item.amount) || 0);
        });

        const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

        return {
            total: total.toFixed(2),
            count: filteredData.length,
            categories: sortedCats
        };
    }, [filteredData]);

    const changeTime = (offset) => {
        setCurrentDate(prev => prev.add(offset, mode));
    };

    return (
        <div className="view-stats">
            <h1 className="pixel-border" style={{ textAlign: 'center', background: '#4b0082', color: 'white', fontSize: '1rem' }}>
                STATISTICS
            </h1>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <button
                    className={`pixel-button ${mode === 'year' ? 'primary' : ''}`}
                    onClick={() => setMode('year')}
                    style={{ fontSize: '0.5rem', padding: '8px 15px' }}
                >
                    YEAR
                </button>
                <button
                    className={`pixel-button ${mode === 'month' ? 'primary' : ''}`}
                    onClick={() => setMode('month')}
                    style={{ fontSize: '0.5rem', padding: '8px 15px' }}
                >
                    MONTH
                </button>
                <button
                    className={`pixel-button ${mode === 'custom' ? 'primary' : ''}`}
                    onClick={() => setMode('custom')}
                    style={{ fontSize: '0.5rem', padding: '8px 15px' }}
                >
                    CUSTOM
                </button>
            </div>

            {/* Range Controller */}
            <div className="pixel-border" style={{ background: '#f9f9f9', padding: '15px', marginBottom: '1.5rem', textAlign: 'center' }}>
                {mode !== 'custom' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                            <button className="pixel-button" onClick={() => changeTime(-1)} style={{ margin: 0 }}>&lt;</button>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {mode === 'month' ? currentDate.format('MMMM YYYY') : currentDate.format('YYYY')}
                            </span>
                            <button className="pixel-button" onClick={() => changeTime(1)} style={{ margin: 0 }}>&gt;</button>
                        </div>
                        {effectiveRange && (
                            <div style={{ fontSize: '0.35rem', color: 'var(--pixel-gray)' }}>
                                CYCLE: {effectiveRange.start.format('YYYY-MM-DD')} TO {effectiveRange.end.format('YYYY-MM-DD')}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.5rem' }}>
                            <input
                                type="date"
                                className="pixel-input"
                                style={{ fontSize: '0.5rem', margin: 0, padding: '5px' }}
                                value={customRange.start}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span>TO</span>
                            <input
                                type="date"
                                className="pixel-input"
                                style={{ fontSize: '0.5rem', margin: 0, padding: '5px' }}
                                value={customRange.end}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginBottom: '2rem' }}>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '6px solid var(--pixel-danger)' }}>
                    <p style={{ fontSize: '0.4rem', margin: '5px' }}>TOTAL SPENT</p>
                    <h2 style={{ margin: '5px 0', color: 'var(--pixel-danger)', fontSize: '1rem' }}>{summary.total}</h2>
                </div>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '6px solid var(--pixel-primary)' }}>
                    <p style={{ fontSize: '0.4rem', margin: '5px' }}>RECORDS</p>
                    <h2 style={{ margin: '5px 0', color: 'var(--pixel-primary)', fontSize: '1rem' }}>{summary.count}</h2>
                </div>
            </div>

            {/* Breakdown */}
            <div className="pixel-border" style={{ background: 'white', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.6rem', marginBottom: '20px', color: 'var(--pixel-dark)' }}>
                    CATEGORY BREAKDOWN
                </h3>

                {summary.categories.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {summary.categories.map(([cat, val]) => {
                            const totalNum = parseFloat(summary.total) || 1;
                            const percentage = Math.round((val / totalNum) * 100);
                            return (
                                <div key={cat}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{cat.toUpperCase()}</span>
                                        <span>{parseFloat(val).toFixed(0)} {userInfo?.currency} ({percentage}%)</span>
                                    </div>
                                    <div style={{ height: '12px', background: '#f0f0f0', border: '2px solid #212529', position: 'relative' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, percentage)}%`,
                                            background: 'var(--pixel-primary)',
                                            boxShadow: 'inset -2px 0 0 rgba(0,0,0,0.2)'
                                        }}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', fontSize: '0.6rem', padding: '20px', color: 'var(--pixel-gray)' }}>
                        NO ACTIVITY IN THIS CYCLE.
                    </div>
                )}
            </div>

            {/* Hint */}
            {userInfo?.stats_start_date && (
                <div style={{ textAlign: 'center', fontSize: '0.4rem', color: 'var(--pixel-gray)' }}>
                    * Analysis starts from your Global Configuration Date: {userInfo.stats_start_date}
                </div>
            )}
        </div>
    );
}

export default ExpenseAnalysis;
