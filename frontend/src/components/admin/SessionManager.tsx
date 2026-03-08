import { FC, useState, useEffect } from 'react';
import { getActiveSessionsApi } from '../../services/api';
import { Loader, RefreshCw, Monitor, Clock, Globe } from 'lucide-react';
import type { ActiveSession } from './types';

const SessionManager: FC = () => {
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchSessions(); }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await getActiveSessionsApi();
            if (res.success) setSessions(res.sessions);
        } catch (error) { console.error('Failed to fetch sessions', error); }
        finally { setLoading(false); }
    };

    const parseUserAgent = (ua: string) => {
        if (!ua) return 'Unknown';
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return ua.slice(0, 30) + '...';
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Active Sessions</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Recently active users based on API activity</p>
                </div>
                <button onClick={fetchSessions} disabled={loading}
                    className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader className="animate-spin w-8 h-8 text-blue-500" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-12 text-center">
                    <Monitor className="mx-auto mb-3 text-gray-300" size={40} />
                    <p className="text-gray-500 dark:text-gray-400">No active sessions found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sessions.map((session, i) => (
                        <div key={session.userId || i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                                {session.user?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 dark:text-white truncate">
                                    {session.user?.name || 'Unknown User'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Globe size={14} />
                                <span>{session.lastIp || '-'}</span>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Monitor size={14} />
                                <span>{parseUserAgent(session.lastUserAgent)}</span>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock size={14} />
                                    <span>{timeAgo(session.lastActivity)}</span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{session.requestCount} requests</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionManager;
