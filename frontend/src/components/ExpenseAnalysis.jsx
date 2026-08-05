import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import EditExpenseModal from './EditExpenseModal';

function ExpenseAnalysis({ userInfo }) {
    const { expenses, loading } = useExpenses();
    const CHART_COLORS = ['#209cee', '#92cc41', '#f7d51d', '#e76e55', '#adafbc', '#212529', '#7e57c2', '#00acc1'];
    const [periodMode, setPeriodMode] = useState('month');
    const [periodOffset, setPeriodOffset] = useState(0);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [showTransactionsModal, setShowTransactionsModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    
    // 定義期間(月、年、自訂)
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
        // 如果沒登入或是沒有支出資料，回傳預設值
        if (!periodRange || !Array.isArray(expenses)) {
            return { total: '0', dailyAverage: '0', currency: userInfo?.currency || 'TWD', count: 0, transactions: [], categories: [], otherCurrencyTotals: [] };
        }

        // 主要貨幣 = 使用者設定的貨幣，預設為TWD
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
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const averageEnd = new Date(Math.min(periodRange.end.getTime(), today.getTime()));
        const daysInPeriod = Math.max(1, Math.ceil((averageEnd - periodRange.start) / (1000 * 60 * 60 * 24)));

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

        // 回傳統計資料
        return {
            total: total.toFixed(2),
            dailyAverage: (total / daysInPeriod).toFixed(2),
            currency: mainCurrency,
            count: mainCurrencyData.length,
            transactions: mainCurrencyData,
            categories: Object.entries(cats).sort((a, b) => b[1] - a[1]),
            otherCurrencyTotals: Object.entries(otherTotals).map(([currency, amount]) => ({
                currency,
                amount: amount.toFixed(2)
            }))
        };
    }, [expenses, periodRange, userInfo?.currency]);

    // 加總,計算支出百分比用
    const categoryTotal = stats.categories.reduce((sum, [, amount]) => sum + Number(amount), 0);
    
    // 圓餅圖資料整理（大到小排序）
    const chartData = stats.categories
        .map(([name, value]) => ({ name, value: Number(value) || 0 }))
        .sort((a, b) => b.value - a.value);

    // 自訂圖例顯示
    const renderLegend = ({ payload }) => {
        const sortedPayload = [...(payload || [])].sort((a, b) => {
            const amountA = Number(a.payload?.value) || 0;
            const amountB = Number(b.payload?.value) || 0;
            return amountB - amountA;
        });

        // 回傳圖例,百分比跟定義顏色
        return (
            <ul style={{ padding: 0, margin: 0, textAlign: 'center' }}>
                {sortedPayload.map((entry) => {
                    const amount = Number(entry.payload?.value) || 0;
                    const percentage = categoryTotal ? (amount / categoryTotal) * 100 : 0;

                    return (
                        <li key={entry.value} style={{ display: 'inline-block', marginRight: '10px', whiteSpace: 'nowrap' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                marginRight: '4px',
                                backgroundColor: entry.color,
                                verticalAlign: 'middle'
                            }} />
                            <span style={{ color: entry.color }}>{entry.value} {percentage.toFixed(1)}%</span>
                        </li>
                    );
                })}
            </ul>
        );
    };
    
    // 顯示loading 或是 還沒登入
    if ((loading && expenses.length === 0) || !userInfo) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div className="pixel-loader"></div>
                <p style={{ fontSize: '0.6rem', marginTop: '10px' }}>LOADING DATA...</p>
            </div>
        );
    }

    // 版面配置
    return (
        <div className="view-stats">
            {/* 期間模式切換 */}
            <div className="pixel-border" style={{ background: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
                <div className="period-mode-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
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
                    <div className="period-nav" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
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
                    <div className="period-custom-range" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
            <div className="stats-summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-danger)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>TOTAL SPENT</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-danger)', fontSize: '1.2rem' }}>{Math.round(Number(stats.total))} {stats.currency}</h2>
                </div>
                <div className="pixel-border" style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-primary)' }}>
                    <p style={{ fontSize: '0.5rem', marginBottom: '10px' }}>DAILY AVERAGE</p>
                    <h2 style={{ margin: 0, color: 'var(--pixel-primary)', fontSize: '1.2rem' }}>{Math.round(Number(stats.dailyAverage))} {stats.currency}</h2>
                </div>
                <div
                    className="pixel-border"
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowTransactionsModal(true)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') setShowTransactionsModal(true);
                    }}
                    style={{ textAlign: 'center', background: 'white', borderBottom: '8px solid var(--pixel-success)', cursor: 'pointer' }}
                >
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
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="45%"
                                outerRadius={90}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${stats.currency} ${parseFloat(value).toFixed(0)}`} />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                content={renderLegend}
                                wrapperStyle={{ fontSize: '0.6rem', paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {showTransactionsModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="pixel-border" style={{ background: 'white', width: '100%', maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.8rem' }}>TRANSACTIONS: {periodRange?.label}</h3>
                            <button className="pixel-button" onClick={() => setShowTransactionsModal(false)} style={{ fontSize: '0.6rem' }}>
                                CLOSE
                            </button>
                        </div>
                        <div className="pixel-table-wrapper">
                            <table className="pixel-table">
                                <thead>
                                    <tr>
                                        <th>DATE</th>
                                        <th>ITEM</th>
                                        <th>TYPE</th>
                                        <th style={{ textAlign: 'right' }}>CASH</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.transactions.map((expense, index) => (
                                        <tr
                                            key={expense.id || index}
                                            onClick={() => setSelectedExpense(expense)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{expense.date}</td>
                                            <td>{expense.item}</td>
                                            <td><span style={{ color: 'var(--pixel-primary)' }}>{expense.category || '-'}</span></td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                {expense.amount}{expense.currency || stats.currency}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {selectedExpense && (
                <EditExpenseModal
                    expense={selectedExpense}
                    categories={userInfo?.categories || []}
                    onClose={() => setSelectedExpense(null)}
                />
            )}
        </div>
    );
}

export default ExpenseAnalysis;
