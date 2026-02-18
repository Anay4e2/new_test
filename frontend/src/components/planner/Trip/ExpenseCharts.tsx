import { FC } from 'react';
import type { ExpenseSummary } from '@/types';

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; fill: string }> = {
    stay: { label: 'Stay', emoji: '🏨', color: '#3b82f6', fill: 'fill-blue-500' },
    transport: { label: 'Transport', emoji: '🚗', color: '#22c55e', fill: 'fill-green-500' },
    food: { label: 'Food', emoji: '🍽️', color: '#f97316', fill: 'fill-orange-500' },
    activities: { label: 'Activities', emoji: '🎯', color: '#a855f7', fill: 'fill-purple-500' },
    shopping: { label: 'Shopping', emoji: '🛍️', color: '#ef4444', fill: 'fill-red-500' },
    tips: { label: 'Tips', emoji: '💰', color: '#eab308', fill: 'fill-yellow-500' },
    other: { label: 'Other', emoji: '📦', color: '#6b7280', fill: 'fill-gray-500' },
};

interface ExpenseChartsProps {
    summary: ExpenseSummary;
    totalDays: number;
}

// Simple SVG pie chart
const PieChart: FC<{ data: { category: string; amount: number }[]; total: number }> = ({ data, total }) => {
    if (total === 0) return null;

    const size = 160;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 60;
    let cumulativeAngle = -90; // Start from top

    const slices = data.filter(d => d.amount > 0).map(d => {
        const angle = (d.amount / total) * 360;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const endAngle = cumulativeAngle;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        const pathData = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z',
        ].join(' ');

        return { ...d, pathData, color: CATEGORY_CONFIG[d.category]?.color || '#6b7280' };
    });

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 mx-auto">
            {slices.map((slice, i) => (
                <path
                    key={i}
                    d={slice.pathData}
                    fill={slice.color}
                    stroke="white"
                    strokeWidth="1.5"
                    className="dark:stroke-slate-800"
                >
                    <title>{CATEGORY_CONFIG[slice.category]?.label}: ₹{slice.amount.toLocaleString()}</title>
                </path>
            ))}
            {/* Center hole for donut effect */}
            <circle cx={cx} cy={cy} r={28} className="fill-white dark:fill-slate-800" />
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[8px]">Total</text>
            <text x={cx} y={cy + 8} textAnchor="middle" className="fill-slate-800 dark:fill-white text-[10px] font-bold">₹{total >= 1000 ? `${Math.round(total / 1000)}k` : total}</text>
        </svg>
    );
};

// Bar chart: estimated vs actual
const BarChart: FC<{ summary: ExpenseSummary }> = ({ summary }) => {
    const categories = ['stay', 'transport', 'food', 'activities'] as const;
    const maxVal = Math.max(
        ...categories.map(c => Math.max(summary.estimated[c] || 0, summary.actual[c] || 0)),
        1
    );

    return (
        <div className="space-y-3">
            {categories.map(cat => {
                const est = summary.estimated[cat] || 0;
                const act = summary.actual[cat] || 0;
                const cfg = CATEGORY_CONFIG[cat];
                const estPct = (est / maxVal) * 100;
                const actPct = (act / maxVal) * 100;

                return (
                    <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                {cfg.emoji} {cfg.label}
                            </span>
                            <span className="text-gray-400 text-[10px]">
                                ₹{act.toLocaleString()} / ₹{est.toLocaleString()}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {/* Estimated bar */}
                            <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full opacity-30"
                                    style={{ width: `${estPct}%`, backgroundColor: cfg.color }}
                                />
                            </div>
                            {/* Actual bar */}
                            <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${actPct}%`, backgroundColor: cfg.color }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-1">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-gray-300 rounded-full opacity-30" /> Estimated</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-gray-400 rounded-full" /> Actual</span>
            </div>
        </div>
    );
};

// Daily spending line chart (simple SVG)
const DailySpendingChart: FC<{ dailySpending: Record<number, number>; totalDays: number }> = ({ dailySpending, totalDays }) => {
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const values = days.map(d => dailySpending[d] || 0);
    const maxVal = Math.max(...values, 1);

    const width = 280;
    const height = 80;
    const padding = 20;
    const plotW = width - padding * 2;
    const plotH = height - padding;

    const points = values.map((v, i) => {
        const x = padding + (i / Math.max(totalDays - 1, 1)) * plotW;
        const y = height - padding - (v / maxVal) * plotH;
        return { x, y, val: v, day: i + 1 };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line
                    key={pct}
                    x1={padding}
                    y1={height - padding - pct * plotH}
                    x2={width - padding}
                    y2={height - padding - pct * plotH}
                    className="stroke-gray-200 dark:stroke-slate-700"
                    strokeWidth="0.5"
                />
            ))}
            {/* Area fill */}
            <path d={areaD} fill="url(#dailyGradient)" opacity="0.3" />
            {/* Line */}
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots */}
            {points.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" className="dark:stroke-slate-800" />
                    <title>Day {p.day}: ₹{p.val.toLocaleString()}</title>
                </g>
            ))}
            {/* Day labels */}
            {points.filter((_, i) => totalDays <= 7 || i % Math.ceil(totalDays / 7) === 0).map(p => (
                <text key={p.day} x={p.x} y={height - 4} textAnchor="middle" className="fill-gray-400 text-[7px]">
                    D{p.day}
                </text>
            ))}
            <defs>
                <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export const ExpenseCharts: FC<ExpenseChartsProps> = ({ summary, totalDays }) => {
    const pieData = Object.entries(summary.actual)
        .filter(([, amount]) => amount > 0)
        .map(([category, amount]) => ({ category, amount }));

    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-5">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">📊 Spending Analysis</h4>

            {/* Pie + Legend */}
            <div className="flex items-start gap-4">
                <PieChart data={pieData} total={summary.totalActual} />
                <div className="flex-1 space-y-1.5 pt-2">
                    {pieData.map(d => {
                        const cfg = CATEGORY_CONFIG[d.category];
                        const pct = summary.totalActual > 0 ? Math.round((d.amount / summary.totalActual) * 100) : 0;
                        return (
                            <div key={d.category} className="flex items-center gap-2 text-xs">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg?.color || '#6b7280' }} />
                                <span className="text-gray-600 dark:text-gray-400 flex-1">{cfg?.label || d.category}</span>
                                <span className="font-medium text-gray-500">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bar chart */}
            <div>
                <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Estimated vs Actual</h5>
                <BarChart summary={summary} />
            </div>

            {/* Daily spending */}
            {Object.keys(summary.dailySpending).length > 0 && (
                <div>
                    <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Daily Spending</h5>
                    <DailySpendingChart dailySpending={summary.dailySpending} totalDays={totalDays} />
                </div>
            )}
        </div>
    );
};
