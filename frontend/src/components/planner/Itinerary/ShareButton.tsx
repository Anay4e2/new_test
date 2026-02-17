import { FC, useState } from 'react';
import { Share2, Copy, Check, Loader2, X } from 'lucide-react';
import { createShareLink } from '@/services/api';
import type { TripRequest, TripResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareButtonProps {
    tripRequest?: TripRequest;
    tripResult: TripResult;
}

export const ShareButton: FC<ShareButtonProps> = ({ tripRequest, tripResult }) => {
    const [showModal, setShowModal] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            const res = await createShareLink(tripRequest || {}, tripResult);
            if (res.success) {
                // Use frontend URL instead of backend-generated one
                const url = `${window.location.origin}/trip/${res.shareId}`;
                setShareUrl(url);
                setShowModal(true);
            }
        } catch {
            alert('Failed to create share link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <button
                onClick={handleShare}
                disabled={loading}
                className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-50"
                title="Share Trip"
            >
                {loading ? <Loader2 size={22} className="animate-spin" /> : <Share2 size={22} />}
            </button>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Share Your Trip</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Anyone with this link can view your trip itinerary. The link expires in 30 days.
                            </p>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono truncate"
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${copied
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {copied ? (
                                        <><Check size={14} /> Copied!</>
                                    ) : (
                                        <><Copy size={14} /> Copy</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
