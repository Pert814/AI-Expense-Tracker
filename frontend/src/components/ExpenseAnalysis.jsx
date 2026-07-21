import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function ExpenseAnalysis({ expenses, userInfo }) {
    const CHART_COLORS = ['#209cee', '#92cc41', '#f7d51d', '#e76e55', '#adafbc', '#212529', '#7e57c2', '#00acc1'];
    const [periodMode, setPeriodMode] = useState('month');
    const [periodOffset, setPeriodOffset] = useState(0);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    
    // Set date range for each mode from the date in userinfo.
    const periodRange = useMemo(() => {
        const today = new Date();

        if (periodMode === 'custom') {
            if (!customRange.start || !customRange.end) {
                return null;
            }
            const start = new Date(customRange.start);
            const end = new Date(customRange.end);
            end.setHours(23, 59, 59, 999);
            return {
                start,
                end,
                label: `${customRange.start} ~ ${customRange.end}`
            };
        }

        if (periodMode === 'month') {
            const anchorDay = userInfo?.stats_start_date
                ? new Date(userInfo.stats_start_date).getDate()
                : 1;

            let cycleStart = new Date(today.getFullYear(), today.getMonth(), anchorDay);
            if (today.getDate() < anchorDay) {
                cycleStart = new Date(today.getFullYear(), today.getMonth() - 1, anchorDay);
            }

            const start = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + periodOffset, anchorDay);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, anchorDay);
            end.setMilliseconds(end.getMilliseconds() - 1);

            return {
                start,
                end,
                label: start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            };
        }

        if (periodMode === 'year') {
            const anchorDate = userInfo?.stats_start_date ? new Date(userInfo.stats_start_date) : new Date(today.getFullYear(), 0, 1);
            const anchorMonth = anchorDate.getMonth();
            const anchorDay = anchorDate.getDate();

            let cycleStart = new Date(today.getFullYear(), anchorMonth, anchorDay);
            if (today < cycleStart) {
                cycleStart = new Date(today.getFullYear() - 1, anchorMonth, anchorDay);
            }

            const start = new Date(cycleStart.getFullYear() + periodOffset, anchorMonth, anchorDay);
            const end = new Date(start.getFullYear() + 1, anchorMonth, anchorDay);
            end.setMilliseconds(end.getMilliseconds() - 1);

            return {
                start,
                end,
                label: `${start.getFullYear()}`
            };
        }

        return null;
    }, [periodMode, periodOffset, customRange, userInfo?.stats_start_date]);

    // 依照目前選擇的期間，篩選並計算統計資料
    const stats = useMemo(() => {
        if (!periodRange || !Array.isArray(expenses)) {
            return { total: 0, count: 0, categories: [], otherCurrencyTotals: [] };
        }

        const mainCurrency = userInfo?.currency || 'TWD';

        // 先依日期範圍篩選
        const filtered = expenses.filter(item => {
            if (!item.date) return false;
            const itemDate = new Date(item.date);
            return itemDate >= periodRange.start && itemDate <= periodRange.end;
        });

        // 再依幣別分組
        const mainCurrencyData = filtered.filter(item => (item.currency || mainCurrency) === mainCurrency);
        const otherCurrencyData = filtered.filter(item => (item.currency || mainCurrency) !== mainCurrency);

        // 主幣別：總計
        const total = mainCurrencyData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        // 主幣別：分類統計
        const cats = {};
        mainCurrencyData.forEach(item => {
            cats[item.category] = (cats[item.category] || 0) + (parseFloat(item.amount) || 0);
        });

        // 其他幣別：各自加總，不跟主幣別混
        const otherTotals = {};
        otherCurrencyData.forEach(item => {
            const cur = item.currency;
            otherTotals[cur] = (otherTotals[cur] || 0) + (parseFloat(item.amount) || 0);
        });

        return {
            total: total.toFixed(2),
            currency: mainCurrency,
            count: mainCurrencyData.length,
            categories: Object.entries(cats).sort((a, b) => b[1] - a[1]),
            otherCurrencyTotals: Object.entries(otherTotals).map(([currency, amount]) => ({
                currency,
                amount: amount.toFixed(2)
            }))
        };
    }, [expenses, periodRange, userInfo?.currency]);

    return (
        <div className="view-stats">
            {/* 期間模式切換 */}
            <div className="pixel-border" style={{ background: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                    <button
                        className={`pixel-button ${periodMode === 'month' ? 'primary' : ''}`}
                        onClick={() => { setPeriodMode('month'); setPeriodOffset(0); }}
                        style={{ fontSize: '0.6rem' }}
                    >
                        MONTH
                    </button>
                    <button
                        className={`pixel-button ${periodMode === 'year' ? 'primary' : ''}`}
                        onClick={() => { setPeriodMode('year'); setPeriodOffset(0); }}
                        style={{ fontSize: '0.6rem' }}
                    >
                        YEAR
                    </button>
                    <button
                        className={`pixel-button ${periodMode === 'custom' ? 'primary' : ''}`}
                        onClick={() => setPeriodMode('custom')}
                        style={{ fontSize: '0.6rem' }}
                    >
                        CUSTOM
                    </button>
                </div>

                {(periodMode === 'month' || periodMode === 'year') && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
                        <button
                            className="pixel-button"
                            onClick={() => setPeriodOffset(prev => prev - 1)}
                            style={{ fontSize: '0.6rem' }}
                        >
                            ◀ PREV
                        </button>
                        <span style={{ fontSize: '0.7rem', minWidth: '100px' }}>
                            {periodRange?.label || '...'}
                        </span>
                        <button
                            className="pixel-button"
                            onClick={() => setPeriodOffset(prev => prev + 1)}
                            style={{ fontSize: '0.6rem' }}
                        >
                            NEXT ▶
                        </button>
                    </div>
                )}

                {periodMode === 'custom' && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                            className="pixel-input"
                            type="date"
                            value={customRange.start}
                            onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                            style={{ marginBottom: 0, width: 'auto' }}
                        />
                        <span style={{ fontSize: '0.6rem' }}>~</span>
                        <input
                            className="pixel-input"
                            type="date"
                            value={customRange.end}
                            onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                            style={{ marginBottom: 0, width: 'auto' }}
                        />
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-danger)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>TOTAL SPENT</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-danger)', fontSize: '1.2rem' }}>{stats.total}</h2>
                </div>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-primary)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>MAIN CURRENCY</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-primary)', fontSize: '1.2rem' }}>{stats.currency}</h2>
                </div>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-success)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>TRANSACTIONS</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-success)', fontSize: '1.2rem' }}>{stats.count}</h2>
                </div>
            </div>

            {/* 其他幣別提示（如果有的話） */}
            {stats.otherCurrencyTotals.length > 0 && (
                <div className="pixel-border" style={{ background: '#fff9e6', fontSize: '0.6rem', padding: '1rem', marginBottom: '2rem' }}>
                    <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>⚠️ OTHER CURRENCIES (NOT INCLUDED ABOVE):</p>
                    {stats.otherCurrencyTotals.map(({ currency, amount }) => (
                        <p key={currency} style={{ margin: '4px 0' }}>{currency}: {amount}</p>
                    ))}
                </div>
            )}

            {/* Pie Chart */}
            {stats.categories.length === 0 ? (
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', marginBottom: '2rem' }}>
                    NO DATA FOR THIS PERIOD.
                </div>
            ) : (
                <div className="pixel-border" style={{ background: 'white', marginBottom: '2rem', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.7rem', marginBottom: '15px', color: 'var(--pixel-dark)', textAlign: 'center' }}>
                        CATEGORY BREAKDOWN
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={stats.categories.map(([cat, val]) => ({ name: cat, value: val }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {stats.categories.map((_, index) => (
                                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${stats.currency} ${parseFloat(value).toFixed(0)}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default ExpenseAnalysis;