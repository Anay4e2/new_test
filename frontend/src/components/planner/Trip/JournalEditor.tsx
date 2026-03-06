import { FC, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Eye, Edit3, ImagePlus, Trash2, Globe, Lock, Loader2, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { JournalEntry, JournalMood } from '@/types';
import { uploadJournalPhoto } from '@/services/api';
import DOMPurify from 'dompurify';

const MOOD_OPTIONS: { value: JournalMood; emoji: string; label: string }[] = [
    { value: 'amazing', emoji: '😍', label: 'Amazing' },
    { value: 'happy', emoji: '🙂', label: 'Happy' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'challenging', emoji: '💪', label: 'Challenging' },
];

// Simple Markdown renderer (bold, italic, headers, lists) — sanitized against XSS
const renderMarkdown = (md: string): string => {
    const html = md
        .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black mt-4 mb-2">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
        .replace(/\n/g, '<br/>');
    return DOMPurify.sanitize(html);
};

interface JournalEditorProps {
    tripId: string;
    entry?: JournalEntry | null;
    days: { day: number; city: string; places: string[] }[];
    onSave: (data: {
        day: number;
        city: string;
        title: string;
        content: string;
        mood: JournalMood;
        photos: string[];
        placeName?: string;
        isPublic: boolean;
    }) => Promise<void>;
    onClose: () => void;
    saving?: boolean;
}

// Compress image to max 1MB
const compressImage = (file: File, maxSizeKB = 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Scale down if needed
                const MAX_DIM = 1600;
                if (width > MAX_DIM || height > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);

                // Try different quality levels
                let quality = 0.8;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length * 0.75 > maxSizeKB * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const DRAFT_KEY = (tripId: string) => `journal-draft-${tripId}`;

export const JournalEditor: FC<JournalEditorProps> = ({ tripId, entry, days, onSave, onClose, saving }) => {
    const [title, setTitle] = useState(entry?.title || '');
    const [content, setContent] = useState(entry?.content || '');
    const [mood, setMood] = useState<JournalMood>(entry?.mood || 'happy');
    const [photos, setPhotos] = useState<string[]>(entry?.photos || []);
    const [placeName, setPlaceName] = useState(entry?.placeName || '');
    const [isPublic, setIsPublic] = useState(entry?.isPublic || false);
    const [selectedDay, setSelectedDay] = useState(entry?.day || (days[0]?.day ?? 1));
    const [previewMode, setPreviewMode] = useState(false);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentDay = days.find(d => d.day === selectedDay);
    const city = currentDay?.city || entry?.city || '';

    // Auto-save draft
    useEffect(() => {
        if (entry) return; // don't save drafts for existing entries
        const timer = setTimeout(() => {
            const draft = { title, content, mood, photos, placeName, isPublic, selectedDay };
            localStorage.setItem(DRAFT_KEY(tripId), JSON.stringify(draft));
        }, 1000);
        return () => clearTimeout(timer);
    }, [title, content, mood, photos, placeName, isPublic, selectedDay, tripId, entry]);

    // Load draft on mount
    useEffect(() => {
        if (entry) return;
        try {
            const raw = localStorage.getItem(DRAFT_KEY(tripId));
            if (raw) {
                const draft = JSON.parse(raw);
                setTitle(draft.title || '');
                setContent(draft.content || '');
                setMood(draft.mood || 'happy');
                setPhotos(draft.photos || []);
                setPlaceName(draft.placeName || '');
                setIsPublic(draft.isPublic || false);
                if (draft.selectedDay) setSelectedDay(draft.selectedDay);
            }
        } catch { console.warn('Failed to load journal draft from localStorage'); }
    }, []);

    const [uploading, setUploading] = useState(false);

    const handlePhotoUpload = useCallback(async (files: FileList | File[]) => {
        const remaining = 5 - photos.length;
        if (remaining <= 0) return;

        const toProcess = Array.from(files).slice(0, remaining);
        setUploading(true);
        for (const file of toProcess) {
            if (!file.type.startsWith('image/')) continue;
            try {
                const result = await uploadJournalPhoto(file);
                if (result.success && result.url) {
                    setPhotos(prev => [...prev, result.url]);
                }
            } catch {
                // Fallback: compress client-side
                try {
                    const compressed = await compressImage(file);
                    setPhotos(prev => [...prev, compressed]);
                } catch { /* ignore bad files */ }
            }
        }
        setUploading(false);
    }, [photos.length]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handlePhotoUpload(e.dataTransfer.files);
        }
    }, [handlePhotoUpload]);

    const handleSubmit = async () => {
        if (!title.trim() || !city) return;
        await onSave({ day: selectedDay, city, title: title.trim(), content, mood, photos, placeName: placeName || undefined, isPublic });
        // Clear draft on successful save
        localStorage.removeItem(DRAFT_KEY(tripId));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        {entry ? 'Edit Entry' : '✏️ New Journal Entry'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className={clsx('p-2 rounded-lg text-sm transition-colors', previewMode ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500')}
                            title={previewMode ? 'Edit' : 'Preview'}
                        >
                            {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Day + City row */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1 block">Day</label>
                            <select
                                value={selectedDay}
                                onChange={e => setSelectedDay(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 appearance-none pr-8"
                            >
                                {days.map(d => (
                                    <option key={d.day} value={d.day}>Day {d.day} — {d.city}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 bottom-2.5 text-gray-400 pointer-events-none" />
                        </div>
                        {currentDay && currentDay.places.length > 0 && (
                            <div className="relative flex-1">
                                <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-1 block">Place (optional)</label>
                                <select
                                    value={placeName}
                                    onChange={e => setPlaceName(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-200 appearance-none pr-8"
                                >
                                    <option value="">None</option>
                                    {currentDay.places.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 bottom-2.5 text-gray-400 pointer-events-none" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Entry title..."
                            className="w-full bg-transparent text-xl font-bold text-slate-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 border-none outline-none"
                            maxLength={200}
                        />
                    </div>

                    {/* Mood selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mr-1">Mood</span>
                        {MOOD_OPTIONS.map(m => (
                            <button
                                key={m.value}
                                onClick={() => setMood(m.value)}
                                className={clsx(
                                    'text-2xl p-1.5 rounded-lg transition-all',
                                    mood === m.value ? 'bg-blue-100 dark:bg-blue-900/30 scale-110 ring-2 ring-blue-400' : 'hover:bg-gray-100 dark:hover:bg-slate-700 opacity-50 hover:opacity-100'
                                )}
                                title={m.label}
                            >
                                {m.emoji}
                            </button>
                        ))}
                    </div>

                    {/* Content area */}
                    {previewMode ? (
                        <div
                            className="min-h-[150px] p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 prose-sm"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '*Nothing written yet...*') }}
                        />
                    ) : (
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Write about your experience... (Markdown supported: **bold**, *italic*, # headings, - lists)"
                            className="w-full min-h-[150px] bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                            maxLength={10000}
                        />
                    )}

                    {/* Photo upload */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Photos ({photos.length}/5)</span>
                            {photos.length < 5 && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
                                >
                                    {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><ImagePlus size={14} /> Add photo</>}
                                </button>
                            )}
                        </div>

                        {/* Drop zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            className={clsx(
                                'border-2 border-dashed rounded-xl p-3 transition-colors min-h-[80px]',
                                dragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-600',
                                photos.length === 0 && 'flex items-center justify-center'
                            )}
                        >
                            {photos.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center">
                                    Drop photos here or click "Add photo"<br />
                                    <span className="text-[10px]">Max 1MB each, JPEG/PNG</span>
                                </p>
                            ) : (
                                <div className="grid grid-cols-5 gap-2">
                                    {photos.map((p, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                            <img src={p} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                                                className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={e => e.target.files && handlePhotoUpload(e.target.files)}
                        />
                    </div>

                    {/* Public toggle */}
                    <button
                        onClick={() => setIsPublic(!isPublic)}
                        className={clsx(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full justify-center',
                            isPublic
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                                : 'bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-600'
                        )}
                    >
                        {isPublic ? <><Globe size={14} /> Public — visible in shared journals</> : <><Lock size={14} /> Private — only you can see this</>}
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                        {content.length}/10000 chars • Draft auto-saved
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!title.trim() || saving}
                            className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            <Save size={14} />
                            {entry ? 'Update' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export { renderMarkdown, MOOD_OPTIONS };
