import { FC, useState, useEffect } from 'react';
import { getAuditLogsApi } from '../../services/api';
import { Loader, Filter, FileText } from 'lucide-react';
import type { AuditLogEntry, Pagination } from './types';

const AuditLogViewer: FC = () => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [entityFilter, setEntityFilter] = useState('all');

    useEffect(() => { fetchLogs(); }, [pagination.page, entityFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await getAuditLogsApi({
                page: pagination.page,
                limit: pagination.limit,
                entity: entityFilter === 'all' ? undefined : entityFilter
            });
            if (res.success) { setLogs(res.logs); setPagination(res.pagination); }
        } catch (error) { console.error('Failed to fetch audit logs', error); }
        finally { setLoading(false); }
    };

    const actionColors: Record<string, string> = {
        create: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        update: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        delete: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        'bulk-delete': 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };

    const getActionColor = (action: string) => {
        const key = Object.keys(actionColors).find(k => action.toLowerCase().includes(k));
        return key ? actionColors[key] : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300';
    };

    const getAdminName = (adminId: AuditLogEntry['adminId']) => {
        if (typeof adminId === 'object' && adminId?.name) return adminId.name;
        return 'Unknown';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Audit Logs</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track all admin actions</p>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex items-center gap-4">
                <Filter size={18} className="text-gray-400" />
                <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                    className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Entities</option>
                    <option value="place">Places</option>
                    <option value="hotel">Hotels</option>
                    <option value="restaurant">Restaurants</option>
                    <option value="festival">Festivals</option>
                    <option value="trip">Trips</option>
                    <option value="user">Users</option>
                    <option value="settings">Settings</option>
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {pagination.total} total entries
                </span>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Admin</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Entity</th>
                                <th className="px-6 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center"><Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" /></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    <FileText className="mx-auto mb-2 text-gray-300" size={32} />No audit logs found.
                                </td></tr>
                            ) : logs.map(log => (
                                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800 dark:text-white">
                                        {getAdminName(log.adminId)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                                        {log.entity}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                        {log.details ? JSON.stringify(log.details).slice(0, 80) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && logs.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Previous</button>
                        <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogViewer;
