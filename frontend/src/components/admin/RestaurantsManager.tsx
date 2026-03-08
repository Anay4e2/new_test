import { FC, useState, useEffect } from 'react';
import { getAllRestaurantsAdminApi, createRestaurantAdminApi, updateRestaurantAdminApi, deleteRestaurantAdminApi, bulkDeleteRestaurantsApi } from '../../services/api';
import { Search, Plus, Edit2, Trash2, Loader, X, Filter, UtensilsCrossed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';
import type { Pagination } from './types';

interface RestaurantForm {
    name: string;
    cityName: string;
    cuisine: string[];
    type: 'street-food' | 'casual' | 'fine-dining' | 'dhaba' | 'cafe';
    priceRange: 'budget' | 'moderate' | 'expensive';
    averageCost: number;
    rating: number;
    mustTry: string[];
    coordinates: { lat: number; lng: number };
    openingTime: string;
    closingTime: string;
    vegetarian: boolean;
    description: string;
}

const emptyForm: RestaurantForm = {
    name: '', cityName: '', cuisine: [], type: 'casual', priceRange: 'moderate',
    averageCost: 500, rating: 4, mustTry: [], coordinates: { lat: 0, lng: 0 },
    openingTime: '10:00', closingTime: '22:00', vegetarian: false, description: ''
};

const RestaurantsManager: FC = () => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<any>(null);
    const [formData, setFormData] = useState<RestaurantForm>(emptyForm);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [cuisineInput, setCuisineInput] = useState('');
    const [mustTryInput, setMustTryInput] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [confirmState, setConfirmState] = useState<{
        open: boolean; title: string; message: string; confirmLabel: string;
        variant: 'danger' | 'warning'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: () => {} });

    useEffect(() => { fetchRestaurants(); }, [pagination.page, debouncedSearch, typeFilter]);

    const fetchRestaurants = async () => {
        setLoading(true);
        try {
            const res = await getAllRestaurantsAdminApi({ page: pagination.page, limit: pagination.limit, search: debouncedSearch, type: typeFilter });
            if (res.success) { setRestaurants(res.restaurants); setPagination(res.pagination); }
        } catch (error) { console.error('Failed to fetch restaurants', error); }
        finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPagination(p => ({ ...p, page: 1 })); };

    const handleDelete = (id: string, name: string) => {
        setConfirmState({
            open: true, title: 'Delete Restaurant',
            message: `Delete restaurant "${name}"? This cannot be undone.`,
            confirmLabel: 'Delete', variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await deleteRestaurantAdminApi(id); toast.success('Restaurant deleted'); fetchRestaurants(); }
                catch { toast.error('Failed to delete restaurant'); }
            },
        });
    };

    const handleBulkDelete = () => {
        if (selected.size === 0) return;
        setConfirmState({
            open: true, title: 'Bulk Delete',
            message: `Delete ${selected.size} selected restaurants?`,
            confirmLabel: `Delete ${selected.size}`, variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await bulkDeleteRestaurantsApi(Array.from(selected)); setSelected(new Set()); toast.success('Restaurants deleted'); fetchRestaurants(); }
                catch { toast.error('Failed to bulk delete'); }
            },
        });
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const toggleSelectAll = () => {
        if (selected.size === restaurants.length) setSelected(new Set());
        else setSelected(new Set(restaurants.map(r => r._id)));
    };

    const openModal = (restaurant?: any) => {
        if (restaurant) {
            setEditingRestaurant(restaurant);
            setFormData({
                name: restaurant.name, cityName: restaurant.cityName, cuisine: restaurant.cuisine || [],
                type: restaurant.type, priceRange: restaurant.priceRange, averageCost: restaurant.averageCost,
                rating: restaurant.rating, mustTry: restaurant.mustTry || [],
                coordinates: restaurant.coordinates || { lat: 0, lng: 0 },
                openingTime: restaurant.openingTime, closingTime: restaurant.closingTime,
                vegetarian: restaurant.vegetarian || false, description: restaurant.description
            });
        } else {
            setEditingRestaurant(null);
            setFormData(emptyForm);
        }
        setCuisineInput('');
        setMustTryInput('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingRestaurant) await updateRestaurantAdminApi(editingRestaurant._id, formData);
            else await createRestaurantAdminApi(formData);
            setIsModalOpen(false);
            toast.success(editingRestaurant ? 'Restaurant updated' : 'Restaurant created');
            fetchRestaurants();
        } catch { toast.error('Failed to save restaurant'); }
        finally { setProcessing(false); }
    };

    const addChip = (field: 'cuisine' | 'mustTry', value: string, setter: (v: string) => void) => {
        const trimmed = value.trim();
        if (trimmed && !formData[field].includes(trimmed)) {
            setFormData(prev => ({ ...prev, [field]: [...prev[field], trimmed] }));
        }
        setter('');
    };

    const removeChip = (field: 'cuisine' | 'mustTry', value: string) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter(v => v !== value) }));
    };

    const priceLabel = { budget: '₹', moderate: '₹₹', expensive: '₹₹₹' };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Restaurants Management</h2>
                <div className="flex gap-2">
                    {selected.size > 0 && (
                        <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <Trash2 size={18} /> Delete ({selected.size})
                        </button>
                    )}
                    <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Plus size={18} /> Add Restaurant
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search restaurants..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </form>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Types</option>
                        <option value="street-food">Street Food</option>
                        <option value="casual">Casual</option>
                        <option value="fine-dining">Fine Dining</option>
                        <option value="dhaba">Dhaba</option>
                        <option value="cafe">Cafe</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-4"><input type="checkbox" checked={restaurants.length > 0 && selected.size === restaurants.length} onChange={toggleSelectAll} /></th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">City</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" /></td></tr>
                            ) : restaurants.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-16 text-center">
                                    <UtensilsCrossed className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 font-medium">No restaurants found</p>
                                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                                </td></tr>
                            ) : restaurants.map(r => (
                                <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-4"><input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleSelect(r._id)} /></td>
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        <div className="flex items-center gap-2"><UtensilsCrossed size={16} className="text-orange-500" />{r.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.cityName}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-semibold capitalize">{r.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{priceLabel[r.priceRange as keyof typeof priceLabel] || r.priceRange}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">⭐ {r.rating}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModal(r)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(r._id, r.name)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && restaurants.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Previous</button>
                        <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setIsModalOpen(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold dark:text-white">{editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input required type="text" value={formData.cityName} onChange={e => setFormData(prev => ({ ...prev, cityName: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as RestaurantForm['type'] }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                                            <option value="street-food">Street Food</option>
                                            <option value="casual">Casual</option>
                                            <option value="fine-dining">Fine Dining</option>
                                            <option value="dhaba">Dhaba</option>
                                            <option value="cafe">Cafe</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price Range</label>
                                        <select value={formData.priceRange} onChange={e => setFormData(prev => ({ ...prev, priceRange: e.target.value as RestaurantForm['priceRange'] }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                                            <option value="budget">Budget</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="expensive">Expensive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avg Cost (₹)</label>
                                        <input required type="number" min={0} value={formData.averageCost} onChange={e => setFormData(prev => ({ ...prev, averageCost: +e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                                        <input required type="number" min={1} max={5} step={0.1} value={formData.rating} onChange={e => setFormData(prev => ({ ...prev, rating: +e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Opening Time</label>
                                        <input required type="time" value={formData.openingTime} onChange={e => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Closing Time</label>
                                        <input required type="time" value={formData.closingTime} onChange={e => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                                        <input type="number" step="any" value={formData.coordinates.lat} onChange={e => setFormData(prev => ({ ...prev, coordinates: { ...prev.coordinates, lat: +e.target.value } }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                                        <input type="number" step="any" value={formData.coordinates.lng} onChange={e => setFormData(prev => ({ ...prev, coordinates: { ...prev.coordinates, lng: +e.target.value } }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="vegetarian" checked={formData.vegetarian} onChange={e => setFormData(prev => ({ ...prev, vegetarian: e.target.checked }))}
                                        className="w-4 h-4 text-green-600 rounded" />
                                    <label htmlFor="vegetarian" className="text-sm font-medium text-gray-700 dark:text-gray-300">Vegetarian Only</label>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea required rows={3} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                {/* Cuisine chips */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuisine</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.cuisine.map(c => (
                                            <span key={c} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs flex items-center gap-1">
                                                {c} <button type="button" onClick={() => removeChip('cuisine', c)}><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input type="text" value={cuisineInput} onChange={e => setCuisineInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip('cuisine', cuisineInput, setCuisineInput); } }}
                                        placeholder="Type and press Enter" className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                {/* Must Try chips */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Must Try Dishes</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.mustTry.map(m => (
                                            <span key={m} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs flex items-center gap-1">
                                                {m} <button type="button" onClick={() => removeChip('mustTry', m)}><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input type="text" value={mustTryInput} onChange={e => setMustTryInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip('mustTry', mustTryInput, setMustTryInput); } }}
                                        placeholder="Type and press Enter" className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                        {processing && <Loader className="animate-spin" size={16} />} {editingRestaurant ? 'Update' : 'Create'}
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

export default RestaurantsManager;
