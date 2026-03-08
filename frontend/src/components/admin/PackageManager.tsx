import { FC, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAllPackagesAdminApi, createPackage, updatePackage, deletePackage } from '../../services/api';
import type { Package } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import ChipInput from '../common/ChipInput';

interface PackageForm {
    id: string;
    title: string;
    state: string;
    days: number;
    price: number;
    image: string;
    description: string;
    tags: string[];
    cities: string[];
    places: string[];
    isActive: boolean;
}

const emptyForm: PackageForm = {
    id: '', title: '', state: '', days: 3, price: 10000,
    image: '', description: '', tags: [], cities: [], places: [], isActive: true
};

const PackageManager: FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState<Package | null>(null);
    const [form, setForm] = useState<PackageForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await getAllPackagesAdminApi();
            if (response.success) setPackages(response.data);
        } catch { toast.error('Failed to load packages.'); } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingPkg(null);
        setForm(emptyForm);
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (pkg: Package) => {
        setEditingPkg(pkg);
        setForm({
            id: pkg.id,
            title: pkg.title,
            state: pkg.state,
            days: pkg.days,
            price: pkg.price,
            image: pkg.image || '',
            description: pkg.description || '',
            tags: pkg.tags || [],
            cities: pkg.cities || [],
            places: pkg.places || [],
            isActive: pkg.isActive
        });
        setFormError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.id.trim() || !form.title.trim() || !form.state.trim()) {
            setFormError('ID, Title, and State are required.');
            return;
        }
        setSaving(true);
        setFormError('');
        try {
            const body = {
                ...form,
                id: form.id.trim(),
                title: form.title.trim(),
                state: form.state.trim(),
                image: form.image.trim(),
                description: form.description.trim()
            };

            if (editingPkg) {
                const res = await updatePackage(editingPkg.id, body);
                if (res.success) {
                    setPackages(prev => prev.map(p => p.id === editingPkg.id ? res.data : p));
                }
            } else {
                const res = await createPackage(body);
                if (res.success) {
                    setPackages(prev => [res.data, ...prev]);
                }
            }
            setShowModal(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to save package.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deletePackage(deleteTarget.id);
            setPackages(prev => prev.filter(p => p.id !== deleteTarget.id));
        } catch { toast.error('Failed to delete package.'); }
        setDeleteTarget(null);
    };

    const handleToggleActive = async (pkg: Package) => {
        try {
            const res = await updatePackage(pkg.id, { isActive: !pkg.isActive } as any);
            if (res.success) {
                setPackages(prev => prev.map(p => p.id === pkg.id ? res.data : p));
            }
        } catch { toast.error('Failed to update package.'); }
    };

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = searchQuery === '' ||
            pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && pkg.isActive) ||
            (filterStatus === 'inactive' && !pkg.isActive);
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Package Management</h2>
                    <p className="text-slate-500 dark:text-slate-400">Create, edit, and manage travel packages.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Package
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by title, state, or ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Package Info</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">State</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price/Range</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                    </td>
                                </tr>
                            ) : filteredPackages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No packages found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPackages.map((pkg) => (
                                    <tr key={pkg.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                                                    {pkg.image ? (
                                                        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{pkg.title}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{pkg.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{pkg.state}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">₹{pkg.price.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">{pkg.days} days</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(pkg)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${pkg.isActive
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                                                    }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${pkg.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {pkg.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(pkg)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => setDeleteTarget(pkg)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {editingPkg ? 'Edit Package' : 'Create Package'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                                {formError && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                        {formError}
                                    </div>
                                )}

                                {/* Image Preview in Form */}
                                <div className="flex gap-4 items-start">
                                    <div className="w-32 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                                        {form.image ? (
                                            <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span className="text-[10px]">Preview</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
                                        <input
                                            type="text"
                                            value={form.image}
                                            onChange={e => setForm({ ...form, image: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Package ID</label>
                                        <input
                                            type="text"
                                            value={form.id}
                                            onChange={e => setForm({ ...form, id: e.target.value })}
                                            disabled={!!editingPkg}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                                            placeholder="unique-id"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Package Title"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={form.state}
                                            onChange={e => setForm({ ...form, state: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (Days)</label>
                                        <input
                                            type="number"
                                            value={form.days}
                                            onChange={e => setForm({ ...form, days: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (₹)</label>
                                        <input
                                            type="number"
                                            value={form.price}
                                            onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    />
                                </div>

                                <ChipInput
                                    label="Tags"
                                    value={form.tags}
                                    onChange={tags => setForm({ ...form, tags })}
                                    placeholder="Add tags (Type & Enter)"
                                />

                                <ChipInput
                                    label="Cities"
                                    value={form.cities}
                                    onChange={cities => setForm({ ...form, cities })}
                                    placeholder="Add cities (Type & Enter)"
                                />

                                <ChipInput
                                    label="Places (IDs)"
                                    value={form.places}
                                    onChange={places => setForm({ ...form, places })}
                                    placeholder="Add place IDs (Type & Enter)"
                                />

                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800">
                                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium text-sm">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-medium text-sm transition-all disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save Package'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleteTarget && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Package?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium">Cancel</button>
                                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-600/20">Delete</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PackageManager;
