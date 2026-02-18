import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Pencil, Trash2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import type { JournalEntry } from '@/types';
import { PhotoGallery } from '@/components/common/PhotoGallery';
import { renderMarkdown, MOOD_OPTIONS } from './JournalEditor';

interface JournalViewProps {
    entries: JournalEntry[];
    readOnly?: boolean;
    onEdit?: (entry: JournalEntry) => void;
    onDelete?: (entryId: string) => void;
}

const getMoodEmoji = (mood: string) => MOOD_OPTIONS.find(m => m.value === mood)?.emoji || '🙂';

export const JournalView: FC<JournalViewProps> = ({ entries, readOnly = false, onEdit, onDelete }) => {
    const [activeDay, setActiveDay] = useState<number | null>(null);

    if (entries.length === 0) {
        return (
            <div className="text-center py-16">
                <BookOpen size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No journal entries yet</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                    {readOnly ? 'The traveler hasn\'t written any entries yet.' : 'Tap the + button to write about your trip!'}
                </p>
            </div>
        );
    }

    // Group entries by day
    const dayMap = new Map<number, JournalEntry[]>();
    entries.forEach(e => {
        const list = dayMap.get(e.day) || [];
        list.push(e);
        dayMap.set(e.day, list);
    });
    const allDays = Array.from(dayMap.keys()).sort((a, b) => a - b);
    const filteredEntries = activeDay !== null ? (dayMap.get(activeDay) || []) : entries;

    return (
        <div>
            {/* Day navigation pills */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setActiveDay(null)}
                    className={clsx(
                        'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                        activeDay === null
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                    )}
                >
                    All Days
                </button>
                {allDays.map(day => {
                    const dayEntries = dayMap.get(day)!;
                    return (
                        <button
                            key={day}
                            onClick={() => setActiveDay(activeDay === day ? null : day)}
                            className={clsx(
                                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                                activeDay === day
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                            )}
                        >
                            Day {day} <span className="ml-1 text-[10px] opacity-70">({dayEntries.length})</span>
                        </button>
                    );
                })}
            </div>

            {/* Swipe navigation (mobile) */}
            {activeDay !== null && (
                <div className="flex items-center justify-between mb-4 sm:hidden">
                    <button
                        onClick={() => {
                            const idx = allDays.indexOf(activeDay);
                            if (idx > 0) setActiveDay(allDays[idx - 1]);
                        }}
                        disabled={allDays.indexOf(activeDay) === 0}
                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 disabled:opacity-30"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Day {activeDay} • {dayMap.get(activeDay)?.[0]?.city}
                    </span>
                    <button
                        onClick={() => {
                            const idx = allDays.indexOf(activeDay);
                            if (idx < allDays.length - 1) setActiveDay(allDays[idx + 1]);
                        }}
                        disabled={allDays.indexOf(activeDay) === allDays.length - 1}
                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-700 disabled:opacity-30"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Timeline */}
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 hidden sm:block" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeDay ?? 'all'}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-6"
                    >
                        {filteredEntries.map((entry, idx) => (
                            <motion.div
                                key={entry._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex gap-4"
                            >
                                {/* Timeline dot */}
                                <div className="hidden sm:flex flex-col items-center shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg shadow-md z-10">
                                        {getMoodEmoji(entry.mood)}
                                    </div>
                                </div>

                                {/* Entry card */}
                                <div className="flex-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {/* Photos with parallax */}
                                    {entry.photos.length > 0 && (
                                        <motion.div
                                            initial={{ y: 0 }}
                                            whileInView={{ y: 0 }}
                                            viewport={{ once: true }}
                                        >
                                            <PhotoGallery images={entry.photos} alt={entry.title} className="h-52" />
                                        </motion.div>
                                    )}

                                    <div className="p-4">
                                        {/* Meta row */}
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-2">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={10} /> Day {entry.day}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <MapPin size={10} /> {entry.city}
                                            </span>
                                            {entry.placeName && (
                                                <>
                                                    <span>•</span>
                                                    <span>{entry.placeName}</span>
                                                </>
                                            )}
                                            <span className="sm:hidden text-lg ml-auto">{getMoodEmoji(entry.mood)}</span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                                            {entry.title}
                                        </h3>

                                        {/* Content */}
                                        {entry.content && (
                                            <div
                                                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed prose-sm max-h-[200px] overflow-hidden relative"
                                                dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.content) }}
                                            />
                                        )}

                                        {/* Actions (owner only) */}
                                        {!readOnly && (
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => onEdit?.(entry)}
                                                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    <Pencil size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => onDelete?.(entry._id)}
                                                    className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                                {entry.isPublic && (
                                                    <span className="ml-auto text-[10px] text-emerald-500 font-medium">🌍 Public</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
