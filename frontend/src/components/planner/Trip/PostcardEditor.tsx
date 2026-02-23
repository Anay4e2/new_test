import { FC, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Image, Type, BarChart3, QrCode, Route, Palette, Check, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import type { TripResult } from '@/types';
import { PostcardGenerator, PostcardConfig, PostcardTemplate, ColorTheme } from './PostcardGenerator';
import { TripStatsCard } from './TripStatsCard';
import { MapSticker } from '../Map/MapSticker';
import { savePostcard } from '@/services/api';

interface PostcardEditorProps {
    result: TripResult;
    isOpen: boolean;
    onClose: () => void;
    shareUrl?: string;
}

const TEMPLATES: { id: PostcardTemplate; label: string; emoji: string; desc: string }[] = [
    { id: 'classic', label: 'Classic', emoji: '📜', desc: 'Vintage postcard' },
    { id: 'modern', label: 'Modern', emoji: '🎯', desc: 'Clean & minimal' },
    { id: 'colorful', label: 'Colorful', emoji: '🌈', desc: 'Vibrant gradient' },
];

const THEMES: { id: ColorTheme; label: string; colors: string[] }[] = [
    { id: 'warm', label: 'Warm', colors: ['#ff6b35', '#d63384'] },
    { id: 'cool', label: 'Cool', colors: ['#2563eb', '#7c3aed'] },
    { id: 'earthy', label: 'Earthy', colors: ['#78716c', '#365314'] },
];

type EditorTab = 'postcard' | 'stats' | 'sticker';

export const PostcardEditor: FC<PostcardEditorProps> = ({ result, isOpen, onClose, shareUrl }) => {
    const [activeTab, setActiveTab] = useState<EditorTab>('postcard');
    const [saving, setSaving] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cities = [...new Set(result.itinerary.map(d => d.city))];

    const [config, setConfig] = useState<PostcardConfig>({
        template: 'modern',
        colorTheme: 'cool',
        title: `My ${cities[0] || 'India'} Adventure`,
        message: '',
        showStats: true,
        showQR: !!shareUrl,
        showRoute: true,
        shareUrl,
    });

    const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
        canvasRef.current = canvas;
    }, []);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `trip-postcard-${config.template}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleShare = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return;

            if (navigator.share && navigator.canShare) {
                const file = new File([blob], 'trip-postcard.png', { type: 'image/png' });
                const shareData = { files: [file], title: config.title, text: 'Check out my trip!' };
                if (navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                    return;
                }
            }
            // Fallback: copy to clipboard
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            alert('Postcard copied to clipboard!');
        } catch {
            // Fallback download
            handleDownload();
        }
    };

    const updateConfig = (partial: Partial<PostcardConfig>) => {
        setConfig(prev => ({ ...prev, ...partial }));
    };

    const handleSaveToGallery = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setSaving(true);
        try {
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Failed to generate image');
            await savePostcard(blob, { template: config.template, title: config.title, message: config.message });
            toast.success('Postcard saved to gallery!');
        } catch {
            toast.error('Failed to save postcard');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Image size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Create Trip Postcard</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Design & share your trip memories</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Tab switch */}
                            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 mr-3">
                                <button onClick={() => setActiveTab('postcard')} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === 'postcard' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-gray-500')}>
                                    🎨 Postcard
                                </button>
                                <button onClick={() => setActiveTab('stats')} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === 'stats' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-gray-500')}>
                                    📊 Stats Card
                                </button>
                                <button onClick={() => setActiveTab('sticker')} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', activeTab === 'sticker' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-gray-500')}>
                                    🗺️ Map Sticker
                                </button>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto">
                        {activeTab === 'postcard' ? (
                            <div className="flex flex-col lg:flex-row">
                                {/* Preview */}
                                <div className="flex-1 p-6 bg-gray-50 dark:bg-slate-950 flex items-center justify-center min-h-[350px]">
                                    <div className="w-full max-w-[600px]">
                                        <PostcardGenerator
                                            result={result}
                                            config={config}
                                            onCanvasReady={handleCanvasReady}
                                            width={600}
                                            height={315}
                                        />
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-700 p-5 space-y-5 overflow-y-auto max-h-[50vh] lg:max-h-[65vh]">
                                    {/* Template Selector */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Template</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {TEMPLATES.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => updateConfig({ template: t.id })}
                                                    className={clsx(
                                                        'p-2 rounded-xl border-2 text-center transition-all',
                                                        config.template === t.id
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                                                    )}
                                                >
                                                    <div className="text-xl mb-0.5">{t.emoji}</div>
                                                    <div className="text-[10px] font-semibold text-slate-700 dark:text-gray-300">{t.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color Theme */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Palette size={12} /> Color Theme
                                        </label>
                                        <div className="flex gap-2">
                                            {THEMES.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => updateConfig({ colorTheme: t.id })}
                                                    className={clsx('flex-1 p-2 rounded-xl border-2 transition-all relative', config.colorTheme === t.id ? 'border-blue-500' : 'border-gray-200 dark:border-slate-700')}
                                                >
                                                    <div className="h-6 rounded-lg mb-1" style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }} />
                                                    <div className="text-[10px] font-medium text-center text-gray-600 dark:text-gray-400">{t.label}</div>
                                                    {config.colorTheme === t.id && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                            <Check size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                            <Type size={12} /> Title
                                        </label>
                                        <input
                                            type="text"
                                            value={config.title}
                                            onChange={e => updateConfig({ title: e.target.value })}
                                            maxLength={40}
                                            className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Custom Message</label>
                                        <textarea
                                            value={config.message}
                                            onChange={e => updateConfig({ message: e.target.value })}
                                            maxLength={80}
                                            rows={2}
                                            placeholder="Add a personal touch..."
                                            className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    {/* Toggles */}
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Elements</label>
                                        <div className="space-y-2">
                                            {[
                                                { key: 'showStats', icon: BarChart3, label: 'Trip Stats' },
                                                { key: 'showRoute', icon: Route, label: 'City Route' },
                                                { key: 'showQR', icon: QrCode, label: 'QR Code', disabled: !shareUrl },
                                            ].map(item => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => updateConfig({ [item.key]: !(config as any)[item.key] })}
                                                    disabled={item.disabled}
                                                    className={clsx(
                                                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                                        (config as any)[item.key]
                                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                            : 'bg-gray-100 dark:bg-slate-800 text-gray-500',
                                                        item.disabled && 'opacity-40 cursor-not-allowed'
                                                    )}
                                                >
                                                    <item.icon size={14} />
                                                    <span className="flex-1 text-left font-medium">{item.label}</span>
                                                    <div className={clsx('w-8 h-5 rounded-full transition-colors relative', (config as any)[item.key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600')}>
                                                        <div className={clsx('w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] transition-all', (config as any)[item.key] ? 'right-[3px]' : 'left-[3px]')} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'stats' ? (
                            /* Stats Card Tab */
                            <div className="p-6">
                                <TripStatsCard result={result} />
                            </div>
                        ) : (
                            /* Map Sticker Tab */
                            <div className="p-6">
                                <MapSticker result={result} />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between bg-white dark:bg-slate-900">
                        <p className="text-xs text-gray-400">1200×630px · Optimized for social sharing</p>
                        <div className="flex gap-2">
                            <button onClick={handleSaveToGallery} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50">
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <Share2 size={16} /> Share
                            </button>
                            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-colors">
                                <Download size={16} /> Download PNG
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
