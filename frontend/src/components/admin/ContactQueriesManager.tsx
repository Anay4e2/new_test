import { FC, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ContactQuery {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved';
    adminNote?: string;
    createdAt: string;
}

const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const ContactQueriesManager: FC = () => {
    const [queries, setQueries] = useState<ContactQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = { page, limit: 15 };
            if (filterStatus !== 'all') params.status = filterStatus;
            const response = await api.get('/admin/contact-queries', { params });
            setQueries(response.data.queries);
            setTotalPages(response.data.pagination.totalPages);
            setTotal(response.data.pagination.total);
        } catch {
            toast.error('Failed to load contact queries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, [page, filterStatus]);

    const handleUpdateStatus = async (id: string, status: string) => {
        setUpdating(true);
        try {
            const response = await api.put(`/admin/contact-queries/${id}`, { status, adminNote: adminNote || undefined });
            const updated = response.data.query;
            setQueries((prev) => prev.map((q) => (q._id === id ? updated : q)));
            if (selectedQuery?._id === id) setSelectedQuery(updated);
            toast.success('Query updated');
        } catch {
            toast.error('Failed to update query');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this contact query?')) return;
        try {
            await api.delete(`/admin/contact-queries/${id}`);
            setQueries((prev) => prev.filter((q) => q._id !== id));
            if (selectedQuery?._id === id) setSelectedQuery(null);
            toast.success('Query deleted');
        } catch {
            toast.error('Failed to delete query');
        }
    };

    const openQuery = (query: ContactQuery) => {
        setSelectedQuery(query);
        setAdminNote(query.adminNote || '');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{total} total queries</p>
                </div>
                <div className="flex items-center gap-2">
                    {['all', 'new', 'in-progress', 'resolved'].map((s) => (
                        <button
                            key={s}
                            onClick={() => { setFilterStatus(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* List */}
                <div className="lg:col-span-3 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : queries.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                            <p className="text-lg mb-1">No queries found</p>
                            <p className="text-sm">Queries submitted via the Contact page will appear here.</p>
                        </div>
                    ) : (
                        <>
                            {queries.map((query) => (
                                <motion.div
                                    key={query._id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => openQuery(query)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                        selectedQuery?._id === query._id
                                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{query.subject}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[query.status]}`}>
                                                    {query.status === 'in-progress' ? 'In Progress' : query.status.charAt(0).toUpperCase() + query.status.slice(1)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{query.name} · {query.email}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{query.message}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {new Date(query.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-4">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-2">
                    {selectedQuery ? (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 sticky top-20 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[selectedQuery.status]}`}>
                                    {selectedQuery.status === 'in-progress' ? 'In Progress' : selectedQuery.status.charAt(0).toUpperCase() + selectedQuery.status.slice(1)}
                                </span>
                                <button
                                    onClick={() => handleDelete(selectedQuery._id)}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                                >
                                    Delete
                                </button>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{selectedQuery.subject}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    From {selectedQuery.name} ({selectedQuery.email}) · {new Date(selectedQuery.createdAt).toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedQuery.message}</p>
                            </div>

                            {/* Admin Note */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Admin Note</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                                    placeholder="Add an internal note..."
                                />
                            </div>

                            {/* Status Actions */}
                            <div className="flex flex-wrap gap-2">
                                {selectedQuery.status !== 'in-progress' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedQuery._id, 'in-progress')}
                                        disabled={updating}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                                    >
                                        Mark In Progress
                                    </button>
                                )}
                                {selectedQuery.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedQuery._id, 'resolved')}
                                        disabled={updating}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                                {selectedQuery.status !== 'new' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedQuery._id, 'new')}
                                        disabled={updating}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                                    >
                                        Reopen
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center">
                            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-slate-400 dark:text-slate-500">Select a query to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactQueriesManager;
