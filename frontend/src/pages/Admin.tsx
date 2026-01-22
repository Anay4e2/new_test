import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

interface AnalyticsSummary {
    day: { pageview: number; search: number; trip_generation: number; api_call: number; total: number };
    week: { pageview: number; search: number; trip_generation: number; api_call: number; total: number };
    month: { pageview: number; search: number; trip_generation: number; api_call: number; total: number };
}

interface TrafficData {
    date: string;
    pageview: number;
    search: number;
    trip_generation: number;
    api_call: number;
    total: number;
}

interface SearchData {
    query: string;
    count: number;
    lastSearched: string;
}

export const Admin: FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [traffic, setTraffic] = useState<TrafficData[]>([]);
    const [searches, setSearches] = useState<SearchData[]>([]);
    const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryRes, trafficRes, searchesRes] = await Promise.all([
                api.get('/admin/analytics/summary'),
                api.get(`/admin/analytics/traffic?period=${period}`),
                api.get(`/admin/analytics/searches?period=${period}`)
            ]);

            if (summaryRes.data.success) setSummary(summaryRes.data.data);
            if (trafficRes.data.success) setTraffic(trafficRes.data.data);
            if (searchesRes.data.success) setSearches(searchesRes.data.data);
        } catch (err: any) {
            console.error('Failed to fetch analytics:', err);
            setError(err.response?.data?.message || 'Failed to load analytics. Make sure you have admin access.');
        } finally {
            setLoading(false);
        }
    };

    const periodLabels = { day: 'Today', week: 'This Week', month: 'This Month' };

    const getMaxTraffic = () => {
        if (traffic.length === 0) return 1;
        return Math.max(...traffic.map(t => t.total), 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-sm text-gray-400">Analytics & Traffic Overview</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">Logged in as {user?.name}</span>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            ← Back to App
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Period Selector */}
                <div className="flex gap-2 mb-8">
                    {(['day', 'week', 'month'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 mb-8 text-red-400">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-blue-400">{summary[period].total}</div>
                                    <div className="text-sm text-gray-400 mt-1">Total Requests</div>
                                </div>
                                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-green-400">{summary[period].pageview}</div>
                                    <div className="text-sm text-gray-400 mt-1">Page Views</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-purple-400">{summary[period].search}</div>
                                    <div className="text-sm text-gray-400 mt-1">Searches</div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-orange-400">{summary[period].trip_generation}</div>
                                    <div className="text-sm text-gray-400 mt-1">Trips Generated</div>
                                </div>
                            </div>
                        )}

                        {/* Traffic Chart (Simple Bar Chart) */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-semibold mb-4">Traffic Over Time</h3>
                            {traffic.length > 0 ? (
                                <div className="flex items-end gap-1 h-48">
                                    {traffic.map((t, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center group">
                                            <div className="relative w-full flex flex-col items-center">
                                                <div
                                                    className="w-full max-w-8 bg-gradient-to-t from-orange-500 to-pink-500 rounded-t-sm transition-all group-hover:from-orange-400 group-hover:to-pink-400"
                                                    style={{ height: `${(t.total / getMaxTraffic()) * 150}px`, minHeight: '4px' }}
                                                />
                                                <div className="absolute -top-6 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t.total}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left truncate max-w-12">
                                                {t.date.split(' ')[0].slice(5)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">No traffic data for this period</div>
                            )}
                        </div>

                        {/* Top Searches */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Top Searches</h3>
                            {searches.length > 0 ? (
                                <div className="space-y-2">
                                    {searches.slice(0, 10).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg">
                                            <span className="text-gray-300 truncate flex-1">{s.query}</span>
                                            <span className="text-orange-400 font-medium ml-4">{s.count} searches</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">No search data for this period</div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};
