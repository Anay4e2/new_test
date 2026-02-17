import { FC, useState, useEffect, useMemo } from 'react';
import { TripResult, TripRequest, PackingList as PackingListType, PackingItem } from '@/types';
import { getPackingList } from '@/services/api';
import { ChevronDown, Loader2, Printer, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface PackingListProps {
    result: TripResult;
    request?: TripRequest;
}

const CATEGORY_META: { key: keyof PackingListType; label: string; icon: string; color: string }[] = [
    { key: 'essentials', label: 'Essentials', icon: '⚡', color: 'bg-amber-500' },
    { key: 'clothing', label: 'Clothing', icon: '👕', color: 'bg-blue-500' },
    { key: 'accessories', label: 'Accessories', icon: '🎒', color: 'bg-purple-500' },
    { key: 'documents', label: 'Documents', icon: '📄', color: 'bg-emerald-500' },
    { key: 'healthKit', label: 'Health Kit', icon: '💊', color: 'bg-red-500' },
    { key: 'extras', label: 'Extras', icon: '✨', color: 'bg-indigo-500' },
];

function getStorageKey(result: TripResult): string {
    const cities = [...new Set(result.itinerary.map(d => d.city))].sort().join('-');
    return `packing-checked-${cities}-${result.itinerary.length}d`;
}

const PRIORITY_STYLES: Record<string, string> = {
    'must-have': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'recommended': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'optional': 'bg-gray-100 text-gray-600 dark:bg-slate-600 dark:text-gray-400',
};

export const PackingList: FC<PackingListProps> = ({ result, request }) => {
    const [packingList, setPackingList] = useState<PackingListType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['essentials']));
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const storageKey = useMemo(() => getStorageKey(result), [result]);

    // Load checked state from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                setCheckedItems(new Set(JSON.parse(stored)));
            }
        } catch {
            // Ignore parse errors
        }
    }, [storageKey]);

    // Persist checked state
    useEffect(() => {
        if (checkedItems.size > 0) {
            localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
        } else {
            localStorage.removeItem(storageKey);
        }
    }, [checkedItems, storageKey]);

    // Fetch packing list when section opens
    useEffect(() => {
        if (isOpen && !packingList && !loading) {
            setLoading(true);
            setError(null);
            const month = new Date().getMonth();
            getPackingList(result, month, request?.constraints, request?.budget)
                .then(data => setPackingList(data))
                .catch(() => setError('Failed to generate packing list'))
                .finally(() => setLoading(false));
        }
    }, [isOpen, packingList, loading, result, request]);

    // Count totals
    const { totalItems, checkedCount } = useMemo(() => {
        if (!packingList) return { totalItems: 0, checkedCount: 0 };
        let total = 0;
        for (const cat of CATEGORY_META) {
            total += (packingList[cat.key] || []).length;
        }
        return { totalItems: total, checkedCount: checkedItems.size };
    }, [packingList, checkedItems]);

    const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

    const toggleCategory = (key: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleItem = (itemKey: string) => {
        setCheckedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemKey)) next.delete(itemKey);
            else next.add(itemKey);
            return next;
        });
    };

    const handlePrint = () => {
        if (!packingList) return;
        const cities = [...new Set(result.itinerary.map(d => d.city))].join(' → ');
        let html = `<!DOCTYPE html><html><head><title>Packing List - ${cities}</title>
<style>
body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
h1 { font-size: 22px; margin-bottom: 4px; }
.subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
h2 { font-size: 15px; color: #2563eb; margin: 18px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
.item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.item input[type="checkbox"] { width: 14px; height: 14px; }
.priority { font-size: 10px; padding: 1px 6px; border-radius: 9999px; }
.must-have { background: #fee2e2; color: #b91c1c; }
.recommended { background: #fef3c7; color: #b45309; }
.optional { background: #f3f4f6; color: #4b5563; }
.reason { color: #999; font-size: 11px; margin-left: 26px; }
@media print { body { padding: 12px; } }
</style></head><body>
<h1>🎒 Packing List</h1>
<div class="subtitle">${cities} • ${result.itinerary.length} days</div>`;

        for (const cat of CATEGORY_META) {
            const items = packingList[cat.key];
            if (!items || items.length === 0) continue;
            html += `<h2>${cat.icon} ${cat.label}</h2>`;
            for (const item of items) {
                const key = `${cat.key}-${item.name}`;
                const checked = checkedItems.has(key) ? 'checked' : '';
                html += `<div class="item"><input type="checkbox" ${checked} /><span>${item.icon} ${item.name}</span><span class="priority ${item.priority}">${item.priority}</span></div>`;
                html += `<div class="reason">${item.reason}</div>`;
            }
        }

        html += `</body></html>`;
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 300);
        }
    };

    return (
        <div className="mt-2">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="w-full flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-700/70 dark:to-slate-700/50 border border-teal-100 dark:border-slate-600 rounded-xl hover:shadow-md transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm">
                        <Package size={20} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-text dark:text-white text-base">🎒 Packing List</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {packingList
                                ? `${checkedCount} of ${totalItems} items packed`
                                : 'Auto-generated based on your trip'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Mini progress */}
                    {packingList && totalItems > 0 && (
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div
                                    className={clsx(
                                        'h-full rounded-full transition-all duration-500',
                                        progressPct === 100 ? 'bg-green-500' : 'bg-teal-500'
                                    )}
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{progressPct}%</span>
                        </div>
                    )}
                    <ChevronDown
                        size={18}
                        className={clsx(
                            'text-gray-400 transition-transform duration-300',
                            isOpen && 'rotate-180'
                        )}
                    />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 bg-white dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-xl p-4">
                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                                    <Loader2 size={20} className="animate-spin" />
                                    <span className="text-sm">Generating your packing list...</span>
                                </div>
                            )}

                            {error && (
                                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
                            )}

                            {packingList && (
                                <>
                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-semibold text-text dark:text-white">
                                                {checkedCount === totalItems && totalItems > 0
                                                    ? '✅ All packed!'
                                                    : `${checkedCount} of ${totalItems} items packed`}
                                            </span>
                                            <button
                                                onClick={handlePrint}
                                                className="flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors px-2 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20"
                                            >
                                                <Printer size={14} />
                                                Print List
                                            </button>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                            <motion.div
                                                className={clsx(
                                                    'h-full rounded-full',
                                                    progressPct === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-teal-400 to-cyan-500'
                                                )}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPct}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div className="space-y-2">
                                        {CATEGORY_META.map(cat => {
                                            const items = packingList[cat.key];
                                            if (!items || items.length === 0) return null;
                                            const isExpanded = expandedCategories.has(cat.key);
                                            const catChecked = items.filter(it => checkedItems.has(`${cat.key}-${it.name}`)).length;

                                            return (
                                                <div key={cat.key} className="border border-gray-100 dark:border-slate-600 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => toggleCategory(cat.key)}
                                                        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-slate-600/50 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className={clsx('w-2 h-2 rounded-full', cat.color)} />
                                                            <span className="text-sm font-semibold text-text dark:text-white">
                                                                {cat.icon} {cat.label}
                                                            </span>
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                {catChecked}/{items.length}
                                                            </span>
                                                        </div>
                                                        <ChevronDown
                                                            size={16}
                                                            className={clsx(
                                                                'text-gray-400 transition-transform duration-200',
                                                                isExpanded && 'rotate-180'
                                                            )}
                                                        />
                                                    </button>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: 'auto' }}
                                                                exit={{ height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-3 py-2 space-y-1">
                                                                    {items.map((item: PackingItem) => {
                                                                        const itemKey = `${cat.key}-${item.name}`;
                                                                        const isChecked = checkedItems.has(itemKey);
                                                                        return (
                                                                            <label
                                                                                key={itemKey}
                                                                                className={clsx(
                                                                                    'flex items-center gap-3 py-1.5 px-2 rounded-lg cursor-pointer transition-all group/item',
                                                                                    isChecked
                                                                                        ? 'bg-green-50/50 dark:bg-green-900/10'
                                                                                        : 'hover:bg-gray-50 dark:hover:bg-slate-600/30'
                                                                                )}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={() => toggleItem(itemKey)}
                                                                                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 shrink-0"
                                                                                />
                                                                                <span className="text-base shrink-0">{item.icon}</span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className={clsx(
                                                                                        'text-sm font-medium transition-all',
                                                                                        isChecked
                                                                                            ? 'line-through text-gray-400 dark:text-gray-500'
                                                                                            : 'text-text dark:text-white'
                                                                                    )}>
                                                                                        {item.name}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
                                                                                        {item.reason}
                                                                                    </div>
                                                                                </div>
                                                                                <span className={clsx(
                                                                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0',
                                                                                    PRIORITY_STYLES[item.priority]
                                                                                )}>
                                                                                    {item.priority}
                                                                                </span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
