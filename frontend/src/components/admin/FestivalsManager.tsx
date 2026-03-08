import { FC, useState, useEffect } from 'react';
import { getAllFestivalsAdminApi, createFestivalAdminApi, updateFestivalAdminApi, deleteFestivalAdminApi, bulkDeleteFestivalsApi } from '../../services/api';
import { Search, Plus, Edit2, Trash2, Loader, X, Filter, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUpload from './ImageUpload';
import { useDebounce } from '../../hooks';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';
import type { Pagination } from './types';

interface FestivalForm {
    name: string;
    cityName: string;
    stateCode: string;
    month: number;
    approximateDate: string;
    duration: number;
    type: 'religious' | 'cultural' | 'fair' | 'music' | 'food' | 'art';
    description: string;
    highlights: string[];
    impact: 'must-see' | 'worth-attending' | 'background';
    crowdLevel: 'extreme' | 'high' | 'moderate' | 'low';
    travelAdvisory: string;
    imageUrl: string;
}

const emptyForm: FestivalForm = {
    name: '', cityName: '', stateCode: '', month: 1, approximateDate: '', duration: 1,
    type: 'cultural', description: '', highlights: [], impact: 'worth-attending',
    crowdLevel: 'moderate', travelAdvisory: '', imageUrl: ''
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FestivalsManager: FC = () => {
    const [festivals, setFestivals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFestival, setEditingFestival] = useState<any>(null);
    const [formData, setFormData] = useState<FestivalForm>(emptyForm);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [highlightInput, setHighlightInput] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [confirmState, setConfirmState] = useState<{
        open: boolean; title: string; message: string; confirmLabel: string;
        variant: 'danger' | 'warning'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', confirmLabel: '', variant: 'danger', onConfirm: () => {} });

    useEffect(() => { fetchFestivals(); }, [pagination.page, debouncedSearch, typeFilter]);

    const fetchFestivals = async () => {
        setLoading(true);
        try {
            const res = await getAllFestivalsAdminApi({ page: pagination.page, limit: pagination.limit, search: debouncedSearch, type: typeFilter });
            if (res.success) { setFestivals(res.festivals); setPagination(res.pagination); }
        } catch (error) { console.error('Failed to fetch festivals', error); }
        finally { setLoading(false); }
    };

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPagination(p => ({ ...p, page: 1 })); };

    const handleDelete = (id: string, name: string) => {
        setConfirmState({
            open: true, title: 'Delete Festival',
            message: `Delete festival "${name}"? This cannot be undone.`,
            confirmLabel: 'Delete', variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await deleteFestivalAdminApi(id); toast.success('Festival deleted'); fetchFestivals(); }
                catch { toast.error('Failed to delete festival'); }
            },
        });
    };

    const handleBulkDelete = () => {
        if (selected.size === 0) return;
        setConfirmState({
            open: true, title: 'Bulk Delete',
            message: `Delete ${selected.size} selected festivals?`,
            confirmLabel: `Delete ${selected.size}`, variant: 'danger',
            onConfirm: async () => {
                setConfirmState(prev => ({ ...prev, open: false }));
                try { await bulkDeleteFestivalsApi(Array.from(selected)); setSelected(new Set()); toast.success('Festivals deleted'); fetchFestivals(); }
                catch { toast.error('Failed to bulk delete'); }
            },
        });
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    };

    const toggleSelectAll = () => {
        if (selected.size === festivals.length) setSelected(new Set());
        else setSelected(new Set(festivals.map(f => f._id)));
    };

    const openModal = (festival?: any) => {
        if (festival) {
            setEditingFestival(festival);
            setFormData({
                name: festival.name, cityName: festival.cityName, stateCode: festival.stateCode || '',
                month: festival.month, approximateDate: festival.approximateDate || '',
                duration: festival.duration, type: festival.type, description: festival.description,
                highlights: festival.highlights || [], impact: festival.impact,
                crowdLevel: festival.crowdLevel, travelAdvisory: festival.travelAdvisory || '',
                imageUrl: festival.imageUrl || ''
            });
        } else {
            setEditingFestival(null);
            setFormData(emptyForm);
        }
        setHighlightInput('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            if (editingFestival) await updateFestivalAdminApi(editingFestival._id, formData);
            else await createFestivalAdminApi(formData);
            setIsModalOpen(false);
            toast.success(editingFestival ? 'Festival updated' : 'Festival created');
            fetchFestivals();
        } catch { toast.error('Failed to save festival'); }
        finally { setProcessing(false); }
    };

    const addHighlight = (value: string) => {
        const trimmed = value.trim();
        if (trimmed && !formData.highlights.includes(trimmed)) {
            setFormData(prev => ({ ...prev, highlights: [...prev.highlights, trimmed] }));
        }
        setHighlightInput('');
    };

    const removeHighlight = (value: string) => {
        setFormData(prev => ({ ...prev, highlights: prev.highlights.filter(h => h !== value) }));
    };

    const impactColors: Record<string, string> = {
        'must-see': 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        'worth-attending': 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
        'background': 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Festivals Management</h2>
                <div className="flex gap-2">
                    {selected.size > 0 && (
                        <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <Trash2 size={18} /> Delete ({selected.size})
                        </button>
                    )}
                    <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Plus size={18} /> Add Festival
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
                <form onSubmit={handleSearch} className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Search festivals..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </form>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Types</option>
                        <option value="religious">Religious</option>
                        <option value="cultural">Cultural</option>
                        <option value="fair">Fair</option>
                        <option value="music">Music</option>
                        <option value="food">Food</option>
                        <option value="art">Art</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-4"><input type="checkbox" checked={festivals.length > 0 && selected.size === festivals.length} onChange={toggleSelectAll} /></th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">City</th>
                                <th className="px-6 py-4">Month</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Impact</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader className="animate-spin w-6 h-6 mx-auto text-blue-500" /></td></tr>
                            ) : festivals.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-16 text-center">
                                    <PartyPopper className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-gray-500 font-medium">No festivals found</p>
                                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                                </td></tr>
                            ) : festivals.map(f => (
                                <tr key={f._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-4"><input type="checkbox" checked={selected.has(f._id)} onChange={() => toggleSelect(f._id)} /></td>
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        <div className="flex items-center gap-2"><PartyPopper size={16} className="text-purple-500" />{f.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{f.cityName}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{monthNames[(f.month || 1) - 1]}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-semibold capitalize">{f.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${impactColors[f.impact] || ''}`}>{f.impact}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openModal(f)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(f._id, f.name)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && festivals.length > 0 && (
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
                                <h3 className="text-xl font-bold dark:text-white">{editingFestival ? 'Edit Festival' : 'Add New Festival'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input required type="text" value={formData.cityName} onChange={e => setFormData(p => ({ ...p, cityName: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Code</label>
                                        <input required type="text" value={formData.stateCode} onChange={e => setFormData(p => ({ ...p, stateCode: e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                                        <select value={formData.month} onChange={e => setFormData(p => ({ ...p, month: +e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                                            {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (days)</label>
                                        <input required type="number" min={1} value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: +e.target.value }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as FestivalForm['type'] }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                                            <option value="religious">Religious</option>
                                            <option value="cultural">Cultural</option>
                                            <option value="fair">Fair</option>
                                            <option value="music">Music</option>
                                            <option value="food">Food</option>
                                            <option value="art">Art</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Impact</label>
                                        <select value={formData.impact} onChange={e => setFormData(p => ({ ...p, impact: e.target.value as FestivalForm['impact'] }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                                            <option value="must-see">Must See</option>
                                            <option value="worth-attending">Worth Attending</option>
                                            <option value="background">Background</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crowd Level</label>
                                        <select value={formData.crowdLevel} onChange={e => setFormData(p => ({ ...p, crowdLevel: e.target.value as FestivalForm['crowdLevel'] }))}
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                                            <option value="extreme">Extreme</option>
                                            <option value="high">High</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Approximate Date</label>
                                    <input type="text" value={formData.approximateDate} onChange={e => setFormData(p => ({ ...p, approximateDate: e.target.value }))}
                                        placeholder="e.g. March 15-20" className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea required rows={3} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Travel Advisory</label>
                                    <textarea rows={2} value={formData.travelAdvisory} onChange={e => setFormData(p => ({ ...p, travelAdvisory: e.target.value }))}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                {/* Highlights chips */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Highlights</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.highlights.map(h => (
                                            <span key={h} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs flex items-center gap-1">
                                                {h} <button type="button" onClick={() => removeHighlight(h)}><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input type="text" value={highlightInput} onChange={e => setHighlightInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addHighlight(highlightInput); } }}
                                        placeholder="Type and press Enter" className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg" />
                                </div>
                                <ImageUpload value={formData.imageUrl} onChange={url => setFormData(p => ({ ...p, imageUrl: url }))} label="Festival Image" />
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">Cancel</button>
                                    <button type="submit" disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                        {processing && <Loader className="animate-spin" size={16} />} {editingFestival ? 'Update' : 'Create'}
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

export default FestivalsManager;
