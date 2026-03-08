import { FC, useState, useEffect } from 'react';
import {
    getAllPlacesAdminApi, createPlaceApi, updatePlaceApi, deletePlaceApi, bulkDeletePlacesApi
} from '../../services/api';
import {
    Search, Plus, Edit2, Trash2, MapPin, Loader, X, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';

const PlacesManager: FC = () => {
    const [places, setPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        cityName: '',
        type: 'Point of Interest',
        description: '',
        rating: 4.5,
        timeRequired: 2,
        entryFee: 'Free',
        visitDuration: '2 hours',
        bestTimeOfDay: 'Day',
        coordinates: { lat: 0, lng: 0 }
    });

    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const debouncedSearch = useDebounce(search, 300);

    const [confirmState, setConfirmState] = useState<{
        open: boolean; title: string; message: string; confirmLabel: string;
        variant: 'danger' | 'warning'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: () => {} });

    useEffect(() => {
        fetchPlaces();
    }, [pagination.page, debouncedSearch, typeFilter]);

    const fetchPlaces = async () => {
        setLoading(true);
        try {
            const res = await getAllPlacesAdminApi({
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                type: typeFilter
            });
            if (res.success) {
                setPlaces(res.places);
                setPagination(res.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch places', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination({ ...pagination, page: 1 });
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmState({
            open: true, title: 'Delete Place',
            message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
            confirmLabel: 'Delete', variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await deletePlaceApi(id); toast.success('Place deleted'); fetchPlaces(); }
                catch { toast.error('Failed to delete place'); }
            },
        });
    };

    const handleBulkDelete = () => {
        if (selected.size === 0) return;
        setConfirmState({
            open: true, title: 'Bulk Delete',
            message: `Delete ${selected.size} selected places? This cannot be undone.`,
            confirmLabel: `Delete ${selected.size}`, variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await bulkDeletePlacesApi(Array.from(selected)); setSelected(new Set()); toast.success('Places deleted'); fetchPlaces(); }
                catch { toast.error('Failed to bulk delete'); }
            },
        });
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const toggleSelectAll = () => {
        if (selected.size === places.length) setSelected(new Set());
        else setSelected(new Set(places.map(p => p._id)));
    };

    const openModal = (place?: any) => {
        if (place) {
            setEditingPlace(place);
            setFormData({
                name: place.name,
                cityName: place.cityName || place.city,
                type: place.type,
                description: place.description,
                rating: place.rating,
                timeRequired: place.timeRequired,
                entryFee: place.entryFee,
                visitDuration: place.visitDuration,
                bestTimeOfDay: place.bestTimeOfDay,
                coordinates: place.coordinates || { lat: 0, lng: 0 }
            });
        } else {
            setEditingPlace(null);
            setFormData({
                name: '',
                cityName: '',
                type: 'Point of Interest',
                description: '',
                rating: 4.5,
                timeRequired: 2,
                entryFee: 'Free',
                visitDuration: '2 hours',
                bestTimeOfDay: 'Day',
                coordinates: { lat: 0, lng: 0 }
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingPlace) {
                await updatePlaceApi(editingPlace._id, formData);
            } else {
                await createPlaceApi(formData);
            }
            setIsModalOpen(false);
            toast.success(editingPlace ? 'Place updated' : 'Place created');
            fetchPlaces();
        } catch (error) {
            console.error('Failed to save place', error);
            toast.error('Failed to save place');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Places Management</h2>
                <div className="flex gap-2">
                    {selected.size > 0 && (
                        <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <Trash2 size={18} /> Delete ({selected.size})
                        </button>
                    )}
                    <button
                        onClick={() => openModal()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Place
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search places or cities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="Point of Interest">Point of Interest</option>
                        <option value="Historical">Historical</option>
                        <option value="Nature">Nature</option>
                        <option value="Religious">Religious</option>
                        <option value="Food">Food</option>
                        <option value="Market">Market</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-4"><input type="checkbox" checked={places.length > 0 && selected.size === places.length} onChange={toggleSelectAll} /></th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">City</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center">
                                        <Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" />
                                    </td>
                                </tr>
                            ) : places.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <MapPin className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="text-gray-500 font-medium">No places found</p>
                                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                                    </td>
                                </tr>
                            ) : (
                                places.map((place) => (
                                    <tr key={place._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-4 py-4"><input type="checkbox" checked={selected.has(place._id)} onChange={() => toggleSelect(place._id)} /></td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                            {place.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} className="text-gray-400" />
                                                {place.cityName || place.city}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                                {place.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            ⭐ {place.rating}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(place)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(place._id, place.name)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                {!loading && places.length > 0 && (
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

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold dark:text-white">
                                    {editingPlace ? 'Edit Place' : 'Add New Place'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.cityName}
                                            onChange={e => setFormData({ ...formData, cityName: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <input
                                            type="text"
                                            list="placeTypes"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <datalist id="placeTypes">
                                            <option value="Point of Interest" />
                                            <option value="Historical" />
                                            <option value="Nature" />
                                            <option value="Religious" />
                                            <option value="Food" />
                                            <option value="Market" />
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="5"
                                            value={formData.rating}
                                            onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time (hrs)</label>
                                        <input
                                            type="number"
                                            value={formData.timeRequired}
                                            onChange={e => setFormData({ ...formData, timeRequired: parseFloat(e.target.value) })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entry Fee</label>
                                        <input
                                            type="text"
                                            value={formData.entryFee}
                                            onChange={e => setFormData({ ...formData, entryFee: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Best Time</label>
                                        <select
                                            value={formData.bestTimeOfDay}
                                            onChange={e => setFormData({ ...formData, bestTimeOfDay: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option>Morning</option>
                                            <option>Afternoon</option>
                                            <option>Evening</option>
                                            <option>Night</option>
                                            <option>Day</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processing && <Loader className="animate-spin" size={16} />}
                                        Save Place
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
            />
        </div>
    );
};

export default PlacesManager;
