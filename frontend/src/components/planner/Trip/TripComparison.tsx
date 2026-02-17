import { FC } from 'react';
import { TripResult } from '@/types';
import { motion } from 'framer-motion';
import { Zap, Sun, Compass } from 'lucide-react';
import clsx from 'clsx';

interface TripComparisonProps {
    variants: { label: string; tripResult: TripResult }[];
    onSelect: (index: number) => void;
    isLoading?: boolean;
}

const VARIANT_THEMES = [
    { bg: 'from-emerald-500 to-teal-600', icon: Sun, accent: 'emerald', tagline: 'Take it easy' },
    { bg: 'from-blue-500 to-indigo-600', icon: Compass, accent: 'blue', tagline: 'Best of both' },
    { bg: 'from-orange-500 to-red-600', icon: Zap, accent: 'orange', tagline: 'See it all' },
];

const getFeasibilityConfig = (f: string) => {
    if (f === 'comfortable') return { color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800', label: 'Comfortable' };
    if (f === 'tight') return { color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800', label: 'Tight' };
    return { color: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800', label: 'Not Recommended' };
};

export const TripComparison: FC<TripComparisonProps> = ({ variants, onSelect, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin mx-auto" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Generating 3 trip variants...</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Relaxed • Balanced • Fast-Paced</p>
                </div>
            </div>
        );
    }

    if (!variants || variants.length === 0) return null;

    // Find best/worst for color coding
    const costs = variants.map(v => v.tripResult.summary.totalCost);
    const distances = variants.map(v => v.tripResult.summary.totalDistance);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minDist = Math.min(...distances);
    const maxDist = Math.max(...distances);

    return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl rounded-2xl h-full overflow-hidden flex flex-col w-full max-w-2xl mx-auto md:mx-0 border border-white/50 dark:border-slate-700/50">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shrink-0">
                <h2 className="text-2xl font-bold font-serif">Compare Plans</h2>
                <p className="text-white/80 text-sm mt-1">Choose the pace that suits you best</p>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {variants.map((variant, idx) => {
                    const theme = VARIANT_THEMES[idx] || VARIANT_THEMES[1];
                    const Icon = theme.icon;
                    const { summary } = variant.tripResult;
                    const feasibility = getFeasibilityConfig(summary.feasibility);
                    const breakup = summary.costBreakup;
                    const total = summary.totalCost || 1;

                    return (
                        <motion.div
                            key={variant.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.15 }}
                            className="border border-gray-100 dark:border-slate-600 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                        >
                            {/* Card Header */}
                            <div className={clsx('bg-gradient-to-r p-4 text-white flex items-center justify-between', theme.bg)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{variant.label}</h3>
                                        <p className="text-white/80 text-xs">{theme.tagline}</p>
                                    </div>
                                </div>
                                <span className={clsx('text-xs px-3 py-1 rounded-full border font-bold', feasibility.color)}>
                                    {feasibility.label}
                                </span>
                            </div>

                            {/* Metrics Grid */}
                            <div className="p-4 grid grid-cols-3 gap-3">
                                <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Cost</div>
                                    <div className={clsx('font-bold text-lg', summary.totalCost === minCost ? 'text-green-600' : summary.totalCost === maxCost ? 'text-red-500' : 'text-slate-700 dark:text-white')}>
                                        ₹{summary.totalCost.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Distance</div>
                                    <div className={clsx('font-bold text-lg', summary.totalDistance === minDist ? 'text-green-600' : summary.totalDistance === maxDist ? 'text-red-500' : 'text-slate-700 dark:text-white')}>
                                        {Math.round(summary.totalDistance)} km
                                    </div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Days</div>
                                    <div className="font-bold text-lg text-slate-700 dark:text-white">
                                        {variant.tripResult.itinerary.length}
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakup Bar */}
                            <div className="px-4 pb-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-2">Cost Breakup</div>
                                <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700">
                                    <div className="bg-blue-500" style={{ width: `${(breakup.stay / total) * 100}%` }} title={`Stay: ₹${breakup.stay.toLocaleString()}`} />
                                    <div className="bg-amber-500" style={{ width: `${(breakup.transport / total) * 100}%` }} title={`Transport: ₹${breakup.transport.toLocaleString()}`} />
                                    <div className="bg-emerald-500" style={{ width: `${(breakup.activities / total) * 100}%` }} title={`Activities: ₹${breakup.activities.toLocaleString()}`} />
                                    <div className="bg-purple-500" style={{ width: `${(breakup.food / total) * 100}%` }} title={`Food: ₹${breakup.food.toLocaleString()}`} />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Stay</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Transport</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Activities</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Food</span>
                                </div>
                            </div>

                            {/* Select Button */}
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => onSelect(idx)}
                                    className={clsx(
                                        'w-full py-2.5 rounded-xl font-bold text-sm transition-all transform hover:-translate-y-0.5 shadow-md',
                                        `bg-gradient-to-r ${theme.bg} text-white hover:shadow-lg`
                                    )}
                                >
                                    Select This Plan
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
