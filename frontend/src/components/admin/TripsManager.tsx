import { FC, useState, useEffect } from 'react';
import { getAllTripsAdminApi, deleteTripAdminApi } from '../../services/api';
import { Search, Trash2, Loader, Eye, Calendar, Map, User } from 'lucide-react';

const TripsManager: FC = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchTrips();
    }, [pagination.page, search]);

    const fetchTrips = async () => {
        setLoading(true);
        try {
            const res = await getAllTripsAdminApi({
                page: pagination.page,
                limit: pagination.limit,
                search
            });
            if (res.success) {
                setTrips(res.trips);
                setPagination(res.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch trips', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete trip "${title}"? This cannot be undone.`)) {
            try {
                await deleteTripAdminApi(id);
                fetchTrips();
            } catch (error) {
                console.error('Failed to delete trip', error);
                alert('Failed to delete trip');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Trips Management</h2>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search trips by title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </form>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" />
                                    </td>
                                </tr>
                            ) : trips.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No trips found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                trips.map((trip) => (
                                    <tr key={trip._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <Map size={16} className="text-blue-500" />
                                                {trip.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-gray-400" />
                                                {trip.userId?.name || 'Unknown User'}
                                            </div>
                                            <div className="text-xs text-gray-400 ml-6">{trip.userId?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {new Date(trip.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {trip.isPublic ? (
                                                <span className="px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                                                    Public
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 text-xs font-semibold">
                                                    Private
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => window.open(`/trips/${trip._id}`, '_blank')}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="View Trip"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trip._id, trip.title)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Trip"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && trips.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripsManager;
