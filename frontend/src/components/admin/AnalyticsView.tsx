import { FC, useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';

interface TrafficData {
    date: string;
    total: number;
    // other fields if needed for chart
}

interface SearchData {
    query: string;
    count: number;
}

const AnalyticsView: FC = () => {
    const [traffic, setTraffic] = useState<TrafficData[]>([]);
    const [searches, setSearches] = useState<SearchData[]>([]);
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [trafficRes, searchesRes] = await Promise.all([
                api.get(`/admin/analytics/traffic?period=${period}`),
                api.get(`/admin/analytics/searches?period=${period}`)
            ]);
            if (trafficRes.data.success) setTraffic(trafficRes.data.data);
            if (searchesRes.data.success) setSearches(searchesRes.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    };

    const periodLabels = { day: 'Today', week: 'This Week', month: 'This Month' };
    const getMaxTraffic = () => traffic.length === 0 ? 1 : Math.max(...traffic.map(t => t.total), 1);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Detailed insights into traffic and user behavior.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                    {/* Traffic Chart */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Traffic Over Time</h3>
                        {traffic.length > 0 ? (
                            <div className="flex items-end gap-2 h-64">
                                {traffic.map((t, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                                        <div className="w-full flex flex-col justify-end h-full">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(t.total / getMaxTraffic()) * 100}%` }}
                                                transition={{ duration: 0.5, delay: i * 0.05 }}
                                                className="w-full bg-blue-100 dark:bg-blue-900/40 rounded-t-sm group-hover:bg-blue-500 transition-colors relative"
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg transition-opacity whitespace-nowrap z-10">
                                                    {t.total} visits
                                                </div>
                                            </motion.div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2 rotate-45 origin-left truncate w-full">
                                            {t.date.split(' ')[0].slice(5)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-400">No traffic data</div>
                        )}
                    </div>

                    {/* Top Searches */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Searches</h3>
                        {searches.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {searches.slice(0, 10).map((s, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                                                {i + 1}
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-300 truncate text-sm font-medium">{s.query}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                            {s.count}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-slate-400">No search data</div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AnalyticsView;
