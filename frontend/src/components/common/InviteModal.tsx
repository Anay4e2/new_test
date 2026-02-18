import { FC, useState } from 'react';
import { inviteMembers } from '@/services/api';
import { X, Loader2, Send, Mail, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface InviteModalProps {
    groupId: string;
    onClose: () => void;
    onInvited: () => void;
}

export const InviteModal: FC<InviteModalProps> = ({ groupId, onClose, onInvited }) => {
    const [emailInput, setEmailInput] = useState('');
    const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
    const [personalMessage, setPersonalMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ added: string[]; skipped: number } | null>(null);

    const handleSend = async () => {
        const emails = emailInput
            .split(',')
            .map(e => e.trim())
            .filter(e => e && e.includes('@'));

        if (emails.length === 0) return;

        setSending(true);
        try {
            const res = await inviteMembers(groupId, {
                emails,
                role,
                message: personalMessage.trim() || undefined,
            });
            if (res.success) {
                setResult({ added: res.added, skipped: emails.length - res.added.length });
                setTimeout(() => {
                    onInvited();
                }, 1500);
            }
        } catch {
            alert('Failed to send invites. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-500" />
                        Invite Members
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400">
                        <X size={18} />
                    </button>
                </div>

                {result ? (
                    <div className="p-6 text-center">
                        <div className="text-4xl mb-3">✅</div>
                        <p className="font-medium text-slate-800 dark:text-white">
                            {result.added.length} invite{result.added.length !== 1 ? 's' : ''} sent!
                        </p>
                        {result.skipped > 0 && (
                            <p className="text-sm text-gray-400 mt-1">{result.skipped} already in group</p>
                        )}
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {/* Emails */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                Email Addresses
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                                <textarea
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="friend@email.com, travel@buddy.com"
                                    rows={3}
                                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Separate multiple emails with commas</p>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                Role
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setRole('editor')}
                                    className={clsx(
                                        'py-2.5 rounded-xl border text-sm font-medium transition-all',
                                        role === 'editor'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    )}
                                >
                                    ✏️ Editor
                                    <p className="text-[10px] font-normal opacity-70 mt-0.5">Can modify itinerary</p>
                                </button>
                                <button
                                    onClick={() => setRole('viewer')}
                                    className={clsx(
                                        'py-2.5 rounded-xl border text-sm font-medium transition-all',
                                        role === 'viewer'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    )}
                                >
                                    👁️ Viewer
                                    <p className="text-[10px] font-normal opacity-70 mt-0.5">Read-only access</p>
                                </button>
                            </div>
                        </div>

                        {/* Personal Message */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                Personal Message (optional)
                            </label>
                            <input
                                type="text"
                                value={personalMessage}
                                onChange={(e) => setPersonalMessage(e.target.value)}
                                placeholder="Hey! Check out this trip plan..."
                                className="w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={sending || !emailInput.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                            Send Invites
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};
