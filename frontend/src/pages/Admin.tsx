import { FC, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import { getPackages, createPackage, deletePackage } from '../services/api';
import type { Package } from '../types';
import ThemeToggle from '../components/common/ThemeToggle';

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

    // Package management state
    const [packages, setPackages] = useState<Package[]>([]);
    const [showPackageForm, setShowPackageForm] = useState(false);
    const [newPackage, setNewPackage] = useState({
        id: '',
        title: '',
        state: '',
        days: 3,
        price: 10000,
        image: '',
        description: '',
        tags: '',
        cities: '',
        places: ''
    });

    useEffect(() => {
        // Redirect to admin login if not authenticated or not admin
        if (!isAuthenticated()) {
            navigate('/admin-login');
            return;
        }
        if (user?.role !== 'admin') {
            navigate('/admin-login');
            return;
        }
        fetchAnalytics();
        fetchPackages();
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

    const fetchPackages = async () => {
        try {
            const response = await getPackages();
            if (response.success) {
                setPackages(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch packages:', err);
        }
    };

    const handleCreatePackage = async () => {
        try {
            const response = await createPackage({
                id: newPackage.id,
                title: newPackage.title,
                state: newPackage.state,
                days: newPackage.days,
                price: newPackage.price,
                image: newPackage.image,
                description: newPackage.description,
                tags: newPackage.tags.split(',').map(t => t.trim()).filter(Boolean),
                cities: newPackage.cities.split(',').map(c => c.trim()).filter(Boolean),
                places: newPackage.places.split(',').map(p => p.trim()).filter(Boolean)
            });
            if (response.success) {
                setPackages([response.data, ...packages]);
                setShowPackageForm(false);
                setNewPackage({ id: '', title: '', state: '', days: 3, price: 10000, image: '', description: '', tags: '', cities: '', places: '' });
            }
        } catch (err) {
            console.error('Failed to create package:', err);
            alert('Failed to create package');
        }
    };

    const handleDeletePackage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        try {
            await deletePackage(id);
            setPackages(packages.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete package:', err);
        }
    };

    const periodLabels = { day: 'Today', week: 'This Week', month: 'This Month' };

    const getMaxTraffic = () => {
        if (traffic.length === 0) return 1;
        return Math.max(...traffic.map(t => t.total), 1);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-white">TripPlanner</span>
                        </Link>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Logged in as {user?.name}</span>
                        <ThemeToggle />
                        <Link
                            to="/"
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            ← Back to App
                        </Link>
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
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-blue-600">{summary[period].total}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Requests</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-green-600">{summary[period].pageview}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Page Views</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-purple-600">{summary[period].search}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Searches</div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                                    <div className="text-3xl font-bold text-orange-600">{summary[period].trip_generation}</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Trips Generated</div>
                                </div>
                            </div>
                        )}

                        {/* Traffic Chart */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Traffic Over Time</h3>
                            {traffic.length > 0 ? (
                                <div className="flex items-end gap-1 h-48">
                                    {traffic.map((t, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center group">
                                            <div className="relative w-full flex flex-col items-center">
                                                <div
                                                    className="w-full max-w-8 bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600"
                                                    style={{ height: `${(t.total / getMaxTraffic()) * 150}px`, minHeight: '4px' }}
                                                />
                                                <div className="absolute -top-6 text-xs text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {t.total}
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-2 rotate-45 origin-left truncate max-w-12">
                                                {t.date.split(' ')[0].slice(5)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">No traffic data for this period</div>
                            )}
                        </div>

                        {/* Top Searches */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Top Searches</h3>
                            {searches.length > 0 ? (
                                <div className="space-y-2">
                                    {searches.slice(0, 10).map((s, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{s.query}</span>
                                            <span className="text-blue-600 dark:text-blue-400 font-medium ml-4">{s.count} searches</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">No search data for this period</div>
                            )}
                        </div>

                        {/* Package Management */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Package Management</h3>
                                <button
                                    onClick={() => setShowPackageForm(!showPackageForm)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {showPackageForm ? 'Cancel' : '+ Create Package'}
                                </button>
                            </div>

                            {/* Create Package Form */}
                            {showPackageForm && (
                                <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <input
                                            type="text"
                                            placeholder="Package ID (e.g., rajasthan-royal)"
                                            value={newPackage.id}
                                            onChange={(e) => setNewPackage({ ...newPackage, id: e.target.value })}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            value={newPackage.title}
                                            onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="State (e.g., Rajasthan)"
                                            value={newPackage.state}
                                            onChange={(e) => setNewPackage({ ...newPackage, state: e.target.value })}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Days"
                                            value={newPackage.days}
                                            onChange={(e) => setNewPackage({ ...newPackage, days: parseInt(e.target.value) || 0 })}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price (₹)"
                                            value={newPackage.price}
                                            onChange={(e) => setNewPackage({ ...newPackage, price: parseInt(e.target.value) || 0 })}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Image URL"
                                            value={newPackage.image}
                                            onChange={(e) => setNewPackage({ ...newPackage, image: e.target.value })}
                                            className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                    <textarea
                                        placeholder="Description"
                                        value={newPackage.description}
                                        onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        rows={2}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Tags (comma-separated, e.g., Heritage, Culture, Desert)"
                                        value={newPackage.tags}
                                        onChange={(e) => setNewPackage({ ...newPackage, tags: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cities (comma-separated, e.g., Jaipur, Udaipur)"
                                        value={newPackage.cities}
                                        onChange={(e) => setNewPackage({ ...newPackage, cities: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Place IDs (comma-separated)"
                                        value={newPackage.places}
                                        onChange={(e) => setNewPackage({ ...newPackage, places: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleCreatePackage}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Create Package
                                    </button>
                                </div>
                            )}

                            {/* Package List */}
                            {packages.length > 0 ? (
                                <div className="space-y-3">
                                    {packages.map(pkg => (
                                        <div key={pkg._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                                            <div className="flex items-center gap-4">
                                                {pkg.image && (
                                                    <img src={pkg.image} alt={pkg.title} className="w-16 h-12 object-cover rounded" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white">{pkg.title}</div>
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">{pkg.state} • {pkg.days} days • ₹{pkg.price.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeletePackage(pkg.id)}
                                                className="px-3 py-1 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-sm rounded-lg transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">No packages created yet</div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

