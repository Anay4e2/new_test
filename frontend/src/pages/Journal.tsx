import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Loader2, Share2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useAuthStore } from '@/stores/authStore';
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry, getPublicJournal, getMyTrips } from '@/services/api';
import type { JournalEntry, JournalMood, SavedTrip } from '@/types';
import { JournalEditor } from '@/components/planner/Trip/JournalEditor';
import { JournalView } from '@/components/planner/Trip/JournalView';
import ThemeToggle from '@/components/common/ThemeToggle';

export const Journal: FC = () => {
    const { tripId } = useParams<{ tripId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState<SavedTrip | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [tripTitle, setTripTitle] = useState('');

    // Determine if user owns this trip
    useEffect(() => {
        const load = async () => {
            if (!tripId) return;
            setLoading(true);

            try {
                if (isAuthenticated()) {
                    // Try loading as owner
                    const tripsRes = await getMyTrips();
                    if (tripsRes.success) {
                        const found = tripsRes.trips.find((t: SavedTrip) => t._id === tripId);
                        if (found) {
                            setTrip(found);
                            setIsOwner(true);
                            setTripTitle(found.title);
                            // Load owner entries
                            const entriesRes = await getJournalEntries(tripId);
                            if (entriesRes.success) setEntries(entriesRes.entries);
                            setLoading(false);
                            return;
                        }
                    }
                }
                // Fall through to public view
                const publicRes = await getPublicJournal(tripId);
                if (publicRes.success) {
                    setEntries(publicRes.entries);
                    setTripTitle(publicRes.tripTitle);
                }
                setIsOwner(false);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [tripId]);

    // Extract days info from trip for the editor
    const days = useMemo(() => {
        if (!trip?.tripResult?.itinerary) return [{ day: 1, city: 'Unknown', places: [] as string[] }];
        return trip.tripResult.itinerary.map((d: any, i: number) => ({
            day: i + 1,
            city: d.city || 'Unknown',
            places: (d.activities || []).map((a: any) => a.name) as string[],
        }));
    }, [trip]);

    const handleSave = useCallback(async (data: { day: number; city: string; title: string; content: string; mood: JournalMood; photos: string[]; placeName?: string; isPublic: boolean }) => {
        if (!tripId) return;
        setSaving(true);
        try {
            if (editingEntry) {
                const res = await updateJournalEntry(editingEntry._id, data);
                if (res.success) {
                    setEntries(prev => prev.map(e => e._id === editingEntry._id ? res.entry : e));
                }
            } else {
                const res = await createJournalEntry({ ...data, tripId });
                if (res.success) {
                    setEntries(prev => [...prev, res.entry].sort((a, b) => a.day - b.day));
                }
            }
            setShowEditor(false);
            setEditingEntry(null);
        } catch { /* ignore */ }
        finally { setSaving(false); }
    }, [tripId, editingEntry]);

    const handleDelete = useCallback(async (entryId: string) => {
        try {
            const res = await deleteJournalEntry(entryId);
            if (res.success) {
                setEntries(prev => prev.filter(e => e._id !== entryId));
            }
        } catch { /* ignore */ }
    }, []);

    const handleEdit = useCallback((entry: JournalEntry) => {
        setEditingEntry(entry);
        setShowEditor(true);
    }, []);

    const handleShare = useCallback(() => {
        const url = `${window.location.origin}/journal/${tripId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [tripId]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Navigation */}
            <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(isOwner ? '/dashboard' : '/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                <BookOpen size={14} />
                                {tripTitle || 'Travel Journal'}
                            </h1>
                            <p className="text-[10px] text-gray-400">{isOwner ? 'Your journal' : 'Public journal'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {isOwner && (
                            <button
                                onClick={handleShare}
                                className={clsx(
                                    'text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all',
                                    copied
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                )}
                            >
                                {copied ? '✅ Copied!' : <><Share2 size={12} /> Share</>}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-10 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-black text-white mb-2"
                    >
                        📔 Travel Diary
                    </motion.h2>
                    <p className="text-white/70 text-sm">
                        {isOwner
                            ? 'Document your experiences, moods, and memories day by day'
                            : `Explore ${tripTitle || 'this trip'}'s journal`}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-4 text-white/50 text-xs">
                        <span>{entries.length} entries</span>
                        <span>•</span>
                        <span>{new Set(entries.map(e => e.city)).size} cities</span>
                    </div>
                </div>
            </section>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <JournalView
                        entries={entries}
                        readOnly={!isOwner}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* FAB — Add Entry (owner only) */}
            {isOwner && !showEditor && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setEditingEntry(null); setShowEditor(true); }}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-xl flex items-center justify-center z-30 hover:shadow-2xl transition-shadow"
                >
                    <Plus size={24} />
                </motion.button>
            )}

            {/* Editor Modal */}
            <AnimatePresence>
                {showEditor && tripId && (
                    <JournalEditor
                        tripId={tripId}
                        entry={editingEntry}
                        days={days}
                        onSave={handleSave}
                        onClose={() => { setShowEditor(false); setEditingEntry(null); }}
                        saving={saving}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
