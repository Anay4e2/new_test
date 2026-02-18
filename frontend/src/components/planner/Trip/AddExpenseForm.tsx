import { FC, useState } from 'react';
import { addExpense } from '@/services/api';
import { X, Loader2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const CATEGORIES = [
    { key: 'stay', emoji: '🏨', label: 'Stay' },
    { key: 'transport', emoji: '🚗', label: 'Transport' },
    { key: 'food', emoji: '🍽️', label: 'Food' },
    { key: 'activities', emoji: '🎯', label: 'Activities' },
    { key: 'shopping', emoji: '🛍️', label: 'Shopping' },
    { key: 'tips', emoji: '💰', label: 'Tips' },
    { key: 'other', emoji: '📦', label: 'Other' },
];

const PAYMENT_METHODS = [
    { key: 'cash', emoji: '💵', label: 'Cash' },
    { key: 'upi', emoji: '📱', label: 'UPI' },
    { key: 'card', emoji: '💳', label: 'Card' },
    { key: 'other', emoji: '🔄', label: 'Other' },
];

interface AddExpenseFormProps {
    tripId: string;
    totalDays: number;
    cities?: string[];
    onClose: () => void;
    onAdded: () => void;
}

export const AddExpenseForm: FC<AddExpenseFormProps> = ({ tripId, totalDays, cities, onClose, onAdded }) => {
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('food');
    const [description, setDescription] = useState('');
    const [day, setDay] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addAnother, setAddAnother] = useState(false);

    const city = cities && cities.length >= day ? cities[day - 1] : undefined;

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setIsSubmitting(true);
        try {
            const res = await addExpense({
                tripId,
                category,
                amount: parseFloat(amount),
                description: description.trim() || undefined,
                day,
                city,
                paymentMethod,
            });
            if (res.success) {
                if (addAnother) {
                    setAmount('');
                    setDescription('');
                } else {
                    onAdded();
                }
            }
        } catch {
            alert('Failed to add expense. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-800 px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between z-10">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Add Expense</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Amount (₹)</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            autoFocus
                            className="w-full text-3xl font-bold text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Category - one-tap icons */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Category</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => setCategory(cat.key)}
                                    className={clsx(
                                        'flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all text-center',
                                        category === cat.key
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                            : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    )}
                                >
                                    <span className="text-xl">{cat.emoji}</span>
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Description (optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. Hotel room, Taxi to station..."
                            className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Day Selector */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Day</label>
                            <select
                                value={day}
                                onChange={(e) => setDay(Number(e.target.value))}
                                className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {Array.from({ length: totalDays }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Day {i + 1}{cities && cities[i] ? ` — ${cities[i]}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {city && (
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">City</label>
                                <div className="px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300">
                                    {city}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Payment Method</label>
                        <div className="grid grid-cols-4 gap-2">
                            {PAYMENT_METHODS.map(pm => (
                                <button
                                    key={pm.key}
                                    onClick={() => setPaymentMethod(pm.key)}
                                    className={clsx(
                                        'flex flex-col items-center gap-0.5 py-2 rounded-lg border transition-all',
                                        paymentMethod === pm.key
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    )}
                                >
                                    <span className="text-lg">{pm.emoji}</span>
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{pm.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Another toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={addAnother}
                            onChange={(e) => setAddAnother(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Add another after this</span>
                    </label>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Plus size={18} />
                        )}
                        Add Expense
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
