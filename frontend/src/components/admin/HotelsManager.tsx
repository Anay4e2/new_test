import { FC, useState, useEffect } from 'react';
import { getAllHotelsAdminApi, createHotelAdminApi, updateHotelAdminApi, deleteHotelAdminApi, bulkDeleteHotelsApi } from '../../services/api';
import { Search, Plus, Edit2, Trash2, Loader, X, Filter, Hotel as HotelIcon, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUpload from './ImageUpload';
import { useDebounce } from '../../hooks';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';
import type { Pagination } from './types';

interface HotelForm {
    name: string;
    cityName: string;
    stateCode: string;
    tier: 'budget' | 'standard' | 'premium';
    pricePerNight: number;
    rating: number;
    amenities: string[];
    imageUrl: string;
    contactPhone: string;
    bookingUrl: string;
    description: string;
    coordinates: { lat: number; lng: number };
}

const emptyForm: HotelForm = {
    name: '', cityName: '', stateCode: '', tier: 'standard', pricePerNight: 2000,
    rating: 4, amenities: [], imageUrl: '', contactPhone: '', bookingUrl: '',
    description: '', coordinates: { lat: 0, lng: 0 }
};

const HotelsManager: FC = () => {
    const [hotels, setHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState<any>(null);
    const [formData, setFormData] = useState<HotelForm>(emptyForm);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [amenityInput, setAmenityInput] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [confirmState, setConfirmState] = useState<{
        open: boolean; title: string; message: string; confirmLabel: string;
        variant: 'danger' | 'warning'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: () => {} });

    useEffect(() => { fetchHotels(); }, [pagination.page, debouncedSearch, tierFilter]);

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const res = await getAllHotelsAdminApi({ page: pagination.page, limit: pagination.limit, search: debouncedSearch, tier: tierFilter });
            if (res.success) { setHotels(res.hotels); setPagination(res.pagination); }
        } catch (error) { console.error('Failed to fetch hotels', error); }
        finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPagination(prev => ({ ...prev, page: 1 })); };

    const handleDelete = (id: string, name: string) => {
        setConfirmState({
            open: true, title: 'Delete Hotel', message: `Delete hotel "${name}"?`,
            confirmLabel: 'Delete', variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await deleteHotelAdminApi(id); toast.success('Hotel deleted'); fetchHotels(); }
                catch { toast.error('Failed to delete hotel'); }
            },
        });
    };

    const handleBulkDelete = () => {
        if (selected.size === 0) return;
        setConfirmState({
            open: true, title: 'Bulk Delete', message: `Delete ${selected.size} selected hotels?`,
            confirmLabel: `Delete ${selected.size}`, variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await bulkDeleteHotelsApi(Array.from(selected)); setSelected(new Set()); toast.success('Hotels deleted'); fetchHotels(); }
                catch { toast.error('Failed to bulk delete'); }
            },
        });
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    };

    const toggleSelectAll = () => {
        if (selected.size === hotels.length) setSelected(new Set());
        else setSelected(new Set(hotels.map(h => h._id)));
    };

    const openModal = (hotel?: any) => {
        if (hotel) {
            setEditingHotel(hotel);
            setFormData({
                name: hotel.name, cityName: hotel.cityName, stateCode: hotel.stateCode || '',
                tier: hotel.tier, pricePerNight: hotel.pricePerNight, rating: hotel.rating,
                amenities: hotel.amenities || [], imageUrl: hotel.imageUrl || '',
                contactPhone: hotel.contactPhone || '', bookingUrl: hotel.bookingUrl || '',
                description: hotel.description || '', coordinates: hotel.coordinates || { lat: 0, lng: 0 }
            });
        } else {
            setEditingHotel(null);
            setFormData(emptyForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingHotel) await updateHotelAdminApi(editingHotel._id, formData);
            else await createHotelAdminApi(formData);
            setIsModalOpen(false);
            toast.success(editingHotel ? 'Hotel updated' : 'Hotel created');
            fetchHotels();
        } catch { toast.error('Failed to save hotel'); }
        finally { setProcessing(false); }
    };

    const addAmenity = () => {
        const v = amenityInput.trim();
        if (v && !formData.amenities.includes(v)) {
            setFormData(prev => ({ ...prev, amenities: [...prev.amenities, v] }));
        }
        setAmenityInput('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hotels Management</h2>
                <div className="flex gap-2">
                    {selected.size > 0 && (
                        <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm">
                            <Trash2 size={16} /> Delete {selected.size}
                        </button>
                    )}
                    <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Plus size={18} /> Add Hotel
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search hotels or cities..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </form>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Tiers</option>
                        <option value="budget">Budget</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-4">
                                    <input type="checkbox" checked={selected.size === hotels.length && hotels.length > 0} onChange={toggleSelectAll} className="rounded" />
                                </th>
                                <th className="px-6 py-4">Hotel</th>
                                <th className="px-6 py-4">City</th>
                                <th className="px-6 py-4">Tier</th>
                                <th className="px-6 py-4">Price/Night</th>
                                <th className="px-6 py-4">Rating</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" /></td></tr>
                            ) : hotels.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-16 text-center">
                                    <HotelIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 font-medium">No hotels found</p>
                                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                                </td></tr>
                            ) : hotels.map(h => (
                                <tr key={h._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-4"><input type="checkbox" checked={selected.has(h._id)} onChange={() => toggleSelect(h._id)} className="rounded" /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {h.imageUrl ? <img src={h.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <HotelIcon size={20} className="text-gray-400" />}
                                            <span className="font-medium text-slate-800 dark:text-white">{h.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{h.cityName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.tier === 'premium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : h.tier === 'standard' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}>
                                            {h.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">₹{h.pricePerNight?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">⭐ {h.rating}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModal(h)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(h._id, h.name)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && hotels.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <button disabled={pagination.page === 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Previous</button>
                        <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                        <button disabled={pagination.page === pagination.totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-700">Next</button>
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
                                <h3 className="text-xl font-bold dark:text-white">{editingHotel ? 'Edit Hotel' : 'Add Hotel'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <ImageUpload value={formData.imageUrl} onChange={url => setFormData(prev => ({ ...prev, imageUrl: url }))} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input required type="text" value={formData.cityName} onChange={e => setFormData(prev => ({ ...prev, cityName: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Code</label>
                                        <input type="text" value={formData.stateCode} onChange={e => setFormData(prev => ({ ...prev, stateCode: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier</label>
                                        <select value={formData.tier} onChange={e => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="budget">Budget</option>
                                            <option value="standard">Standard</option>
                                            <option value="premium">Premium</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                                        <input type="number" step="0.1" min="1" max="5" value={formData.rating} onChange={e => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price/Night (₹)</label>
                                        <input type="number" value={formData.pricePerNight} onChange={e => setFormData(prev => ({ ...prev, pricePerNight: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                                        <input type="text" value={formData.contactPhone} onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea rows={2} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amenities</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={amenityInput} onChange={e => setAmenityInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                                            placeholder="Type & press Enter"
                                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                                        <button type="button" onClick={addAmenity} className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm">Add</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.amenities.map((a, i) => (
                                            <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs flex items-center gap-1">
                                                {a}
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, amenities: prev.amenities.filter((_, j) => j !== i) }))}
                                                    className="hover:text-red-500">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                        {processing && <Loader className="animate-spin" size={16} />} Save Hotel
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

export default HotelsManager;
