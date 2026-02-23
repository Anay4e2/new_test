import { FC, useEffect, useState } from 'react';
import api from '../../services/api';
import { AnalyticsActivity } from '../../types';
import { motion } from 'framer-motion';

interface DashboardStats {
    pageview: number;
    search: number;
    trip_generation: number;
    api_call: number;
    total: number;
}

const DashboardOverview: FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<AnalyticsActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [summaryRes, recentRes] = await Promise.all([
                api.get('/admin/analytics/summary'),
                api.get('/admin/analytics/recent?limit=20')
            ]);

            if (summaryRes.data.success) {
                // Default to 'week' view for overview
                setStats(summaryRes.data.data.week);
            }
            if (recentRes.data.success) {
                setActivities(recentRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
                <p className="text-slate-500 dark:text-slate-400">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            {stats && (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <StatCard
                        title="Total Requests"
                        value={stats.total}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Page Views"
                        value={stats.pageview}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Searches"
                        value={stats.search}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                        color="bg-purple-500"
                    />
                    <StatCard
                        title="Trips Generated"
                        value={stats.trip_generation}
                        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                        color="bg-orange-500"
                    />
                </motion.div>
            )}

            {/* Recent Activity Feed */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                    <button onClick={fetchData} className="text-slate-400 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {activities.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No recent activity</div>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity._id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${getStatusColor(activity.statusCode)}`} />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {formatActivityTitle(activity)}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                                {activity.method} {activity.endpoint}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className={`text-xs font-medium mt-0.5 ${getLatencyColor(activity.responseTime)}`}>
                                            {activity.responseTime}ms
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: FC<{ title: string; value: number; icon: any; color: string }> = ({ title, value, icon, color }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value.toLocaleString()}</h3>
            </div>
            <div className={`p-3 rounded-xl text-white ${color} shadow-lg shadow-${color.replace('bg-', '')}/30`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                </svg>
            </div>
        </div>
    </motion.div>
);

// Helpers
const getStatusColor = (status: number) => {
    if (status >= 500) return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    if (status >= 400) return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
    if (status >= 300) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
    return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
};

const getLatencyColor = (ms: number) => {
    if (ms > 1000) return 'text-red-500';
    if (ms > 500) return 'text-orange-500';
    return 'text-emerald-500';
};

const formatActivityTitle = (activity: AnalyticsActivity) => {
    if (activity.type === 'search') return `Search: "${activity.searchQuery}"`;
    if (activity.type === 'trip_generation') return 'Trip Generation Request';
    if (activity.type === 'pageview') return 'Page View';
    return 'API Call';
};

export default DashboardOverview;
