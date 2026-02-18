import { FC, useState, useEffect } from 'react';
import type { Expense, ExpenseSummary } from '@/types';
import { getExpensesByTrip, getExpenseSummary, deleteExpense as deleteExpenseApi } from '@/services/api';
import { ChevronDown, ChevronUp, Trash2, Loader2, Plus, PieChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { AddExpenseForm } from './AddExpenseForm';
import { ExpenseCharts } from './ExpenseCharts';

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
    stay: { label: 'Stay', emoji: '🏨', color: 'text-blue-600', bgColor: 'bg-blue-500' },
    transport: { label: 'Transport', emoji: '🚗', color: 'text-green-600', bgColor: 'bg-green-500' },
    food: { label: 'Food', emoji: '🍽️', color: 'text-orange-600', bgColor: 'bg-orange-500' },
    activities: { label: 'Activities', emoji: '🎯', color: 'text-purple-600', bgColor: 'bg-purple-500' },
    shopping: { label: 'Shopping', emoji: '🛍️', color: 'text-red-600', bgColor: 'bg-red-500' },
    tips: { label: 'Tips', emoji: '💰', color: 'text-yellow-600', bgColor: 'bg-yellow-500' },
    other: { label: 'Other', emoji: '📦', color: 'text-gray-600', bgColor: 'bg-gray-500' },
};

const PAYMENT_LABELS: Record<string, string> = {
    cash: '💵 Cash',
    upi: '📱 UPI',
    card: '💳 Card',
    other: '🔄 Other',
};

interface ExpenseTrackerProps {
    tripId: string;
    totalDays: number;
    cities?: string[];
}

export const ExpenseTracker: FC<ExpenseTrackerProps> = ({ tripId, totalDays, cities }) => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<ExpenseSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCharts, setShowCharts] = useState(false);
    const [expandedDay, setExpandedDay] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [expRes, sumRes] = await Promise.all([
                getExpensesByTrip(tripId),
                getExpenseSummary(tripId),
            ]);
            if (expRes.success) setExpenses(expRes.expenses);
            if (sumRes.success) setSummary(sumRes);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [tripId]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await deleteExpenseApi(id);
            if (res.success) {
                setExpenses(prev => prev.filter(e => e._id !== id));
                fetchData(); // Refresh summary
            }
        } catch {
            // silently fail
        } finally {
            setDeletingId(null);
        }
    };

    const handleExpenseAdded = () => {
        setShowAddForm(false);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
        );
    }

    // Group expenses by day
    const expensesByDay: Record<number, Expense[]> = {};
    expenses.forEach(exp => {
        if (!expensesByDay[exp.day]) expensesByDay[exp.day] = [];
        expensesByDay[exp.day].push(exp);
    });

    const budgetStatus = summary
        ? summary.percentUsed > 100 ? 'over' : summary.percentUsed > 80 ? 'warning' : 'under'
        : 'under';

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    💰 Expense Tracker
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCharts(!showCharts)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                        title="View Charts"
                    >
                        <PieChart size={18} />
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={14} />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Budget Overview Bar */}
            {summary && summary.totalEstimated > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Used</span>
                        <span className={clsx(
                            'text-sm font-bold flex items-center gap-1',
                            budgetStatus === 'over' ? 'text-red-600' : budgetStatus === 'warning' ? 'text-amber-600' : 'text-green-600'
                        )}>
                            {budgetStatus === 'over' ? <TrendingUp size={14} /> : budgetStatus === 'warning' ? <Minus size={14} /> : <TrendingDown size={14} />}
                            {summary.percentUsed}%
                        </span>
                    </div>

                    {/* Segmented budget bar */}
                    <div className="relative h-4 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        {/* Estimated segments */}
                        {(() => {
                            const cats = ['stay', 'transport', 'food', 'activities'] as const;
                            let offset = 0;
                            return cats.map(cat => {
                                const pct = summary.totalEstimated > 0 ? ((summary.estimated[cat] || 0) / summary.totalEstimated) * 100 : 0;
                                const el = (
                                    <div
                                        key={cat}
                                        className={clsx(CATEGORY_CONFIG[cat].bgColor, 'absolute top-0 h-full opacity-20')}
                                        style={{ left: `${offset}%`, width: `${pct}%` }}
                                    />
                                );
                                offset += pct;
                                return el;
                            });
                        })()}
                        {/* Actual spending overlay */}
                        <div
                            className={clsx(
                                'absolute top-0 left-0 h-full rounded-full transition-all duration-500',
                                budgetStatus === 'over' ? 'bg-red-500' : budgetStatus === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                            )}
                            style={{ width: `${Math.min(summary.percentUsed, 100)}%` }}
                        />
                    </div>

                    {/* Totals */}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>₹{summary.totalActual.toLocaleString()} spent</span>
                        <span>₹{summary.totalEstimated.toLocaleString()} estimated</span>
                    </div>

                    {/* Category breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {Object.entries(CATEGORY_CONFIG).slice(0, 4).map(([key, cfg]) => {
                            const actual = summary.actual[key] || 0;
                            const estimated = (summary.estimated as any)[key] || 0;
                            return (
                                <div key={key} className="text-center">
                                    <div className="text-lg">{cfg.emoji}</div>
                                    <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{cfg.label}</div>
                                    <div className={clsx('text-xs font-bold', actual > estimated && estimated > 0 ? 'text-red-600' : cfg.color)}>
                                        ₹{actual.toLocaleString()}
                                    </div>
                                    {estimated > 0 && (
                                        <div className="text-[10px] text-gray-400">/ ₹{estimated.toLocaleString()}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {expenses.length === 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">No expenses logged yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start tracking to compare against your budget!</p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        Log First Expense
                    </button>
                </div>
            )}

            {/* Charts */}
            {showCharts && summary && expenses.length > 0 && (
                <ExpenseCharts summary={summary} totalDays={totalDays} />
            )}

            {/* Per-Day Accordion */}
            {Object.keys(expensesByDay).length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Daily Expenses</h4>
                    {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                        const dayExpenses = expensesByDay[day] || [];
                        const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                        if (dayExpenses.length === 0) return null;

                        return (
                            <div key={day} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 w-7 h-7 rounded-full flex items-center justify-center">
                                            {day}
                                        </span>
                                        <span className="text-sm font-medium text-slate-800 dark:text-white">Day {day}</span>
                                        <span className="text-xs text-gray-400">({dayExpenses.length} items)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">₹{dayTotal.toLocaleString()}</span>
                                        {expandedDay === day ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                    </div>
                                </button>

                                {expandedDay === day && (
                                    <div className="border-t border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                                        {dayExpenses.map(exp => (
                                            <div key={exp._id} className="flex items-center gap-3 px-4 py-2.5">
                                                <span className="text-lg">{CATEGORY_CONFIG[exp.category]?.emoji || '📦'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                                        {exp.description || CATEGORY_CONFIG[exp.category]?.label || exp.category}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                                                        <span>{PAYMENT_LABELS[exp.paymentMethod] || exp.paymentMethod}</span>
                                                        {exp.city && <span>• {exp.city}</span>}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-slate-800 dark:text-white">₹{exp.amount.toLocaleString()}</span>
                                                <button
                                                    onClick={() => handleDelete(exp._id)}
                                                    disabled={deletingId === exp._id}
                                                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    {deletingId === exp._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Expense Form Modal */}
            {showAddForm && (
                <AddExpenseForm
                    tripId={tripId}
                    totalDays={totalDays}
                    cities={cities}
                    onClose={() => setShowAddForm(false)}
                    onAdded={handleExpenseAdded}
                />
            )}
        </div>
    );
};
