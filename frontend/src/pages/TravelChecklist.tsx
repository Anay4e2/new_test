import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  getChecklistsApi,
  createChecklistApi,
  updateChecklistApi,
  addChecklistItemApi,
  deleteChecklistApi,
} from '../services/api';

interface ChecklistItem {
  _id?: string;
  label: string;
  checked: boolean;
  category: string;
}

interface Checklist {
  _id: string;
  title: string;
  items: ChecklistItem[];
  updatedAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  documents: '📄',
  essentials: '🎒',
  clothing: '👕',
  toiletries: '🧴',
  electronics: '🔌',
  other: '📦',
};

const CATEGORIES = ['documents', 'essentials', 'clothing', 'toiletries', 'electronics', 'other'];

export const TravelChecklist: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      const data = await getChecklistsApi();
      setChecklists(data.checklists);
      if (data.checklists.length > 0 && !activeId) {
        setActiveId(data.checklists[0]._id);
      }
    } catch {
      toast.error('Failed to load checklists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const data = await createChecklistApi('Travel Checklist');
      setChecklists([data.checklist, ...checklists]);
      setActiveId(data.checklist._id);
      toast.success('Checklist created!');
    } catch {
      toast.error('Failed to create checklist');
    }
  };

  const activeChecklist = checklists.find((c) => c._id === activeId);

  const handleToggleItem = async (index: number) => {
    if (!activeChecklist) return;
    const items = [...activeChecklist.items];
    items[index] = { ...items[index], checked: !items[index].checked };
    try {
      await updateChecklistApi(activeChecklist._id, { items });
      setChecklists(checklists.map((c) => (c._id === activeId ? { ...c, items } : c)));
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleAddItem = async () => {
    if (!activeChecklist || !newItemLabel.trim()) return;
    try {
      const data = await addChecklistItemApi(activeChecklist._id, newItemLabel.trim(), newItemCategory);
      setChecklists(checklists.map((c) => (c._id === activeId ? data.checklist : c)));
      setNewItemLabel('');
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChecklistApi(id);
      setChecklists(checklists.filter((c) => c._id !== id));
      if (activeId === id) setActiveId(checklists.find((c) => c._id !== id)?._id || null);
      toast.success('Checklist deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const checkedCount = activeChecklist?.items.filter((i) => i.checked).length || 0;
  const totalCount = activeChecklist?.items.length || 0;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const groupedItems = CATEGORIES.reduce(
    (acc, cat) => {
      const items = (activeChecklist?.items || [])
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter((item) => item.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {} as Record<string, (ChecklistItem & { originalIndex: number })[]>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition-colors">
            ← {t('common.back')}
          </button>
          <h1 className="text-xl font-bold">{t('checklist.title')}</h1>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          + New Checklist
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {checklists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-white/60 mb-4">No checklists yet</p>
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
            >
              Create Your First Checklist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-2">
              {checklists.map((cl) => (
                <div
                  key={cl._id}
                  onClick={() => setActiveId(cl._id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    activeId === cl._id
                      ? 'bg-blue-600/20 border border-blue-500/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{cl.title}</p>
                    <p className="text-xs text-white/40">
                      {cl.items.filter((i) => i.checked).length}/{cl.items.length} {t('checklist.completed')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cl._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Main */}
            {activeChecklist && (
              <div className="lg:col-span-3">
                {/* Progress */}
                <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/60">
                      {checkedCount} of {totalCount} packed
                    </span>
                    <span className="text-sm font-medium text-blue-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5">
                    <motion.div
                      className="bg-blue-500 h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {progress === 100 && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-emerald-400 text-sm mt-3 text-center"
                    >
                      {t('checklist.allPacked')} 🎉
                    </motion.p>
                  )}
                </div>

                {/* Items by category */}
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>{CATEGORY_ICONS[category]}</span>
                        {category}
                      </h3>
                      <div className="space-y-1">
                        <AnimatePresence>
                          {items.map((item) => (
                            <motion.div
                              key={item.originalIndex}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                                item.checked ? 'bg-emerald-500/10' : 'bg-white/5 hover:bg-white/10'
                              }`}
                              onClick={() => handleToggleItem(item.originalIndex)}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  item.checked
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'border-white/30'
                                }`}
                              >
                                {item.checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-sm ${item.checked ? 'line-through text-white/40' : 'text-white/80'}`}>
                                {item.label}
                              </span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="mt-6 flex gap-2">
                  <input
                    type="text"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder={t('checklist.addItem')}
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-800">
                        {CATEGORY_ICONS[cat]} {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddItem}
                    disabled={!newItemLabel.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
