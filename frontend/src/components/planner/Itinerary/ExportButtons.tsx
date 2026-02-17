import { FC, useState } from 'react';
import { TripResult } from '@/types';
import { FileText, MessageCircle, Mail, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { getWhatsAppText, sendItineraryEmail } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface ExportButtonsProps {
    result: TripResult;
}

export const ExportButtons: FC<ExportButtonsProps> = ({ result }) => {
    const { itinerary } = result;

    // PDF state
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    // WhatsApp state
    const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);

    // Email state
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailAddress, setEmailAddress] = useState('');
    const [attachPdf, setAttachPdf] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [emailMessage, setEmailMessage] = useState('');

    // PDF Download
    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const response = await fetch('http://localhost:3001/api/itinerary/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trip-itinerary-${itinerary.length}days.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // WhatsApp Share
    const handleWhatsAppShare = async () => {
        setIsLoadingWhatsApp(true);
        try {
            const data = await getWhatsAppText(result);
            window.open(data.whatsappUrl, '_blank');
        } catch (error) {
            console.error('Failed to generate WhatsApp text:', error);
            alert('Failed to generate WhatsApp text. Please try again.');
        } finally {
            setIsLoadingWhatsApp(false);
        }
    };

    // Email Send
    const handleSendEmail = async () => {
        if (!emailAddress.trim()) return;
        setIsSendingEmail(true);
        setEmailStatus('idle');
        try {
            const res = await sendItineraryEmail(emailAddress.trim(), result, attachPdf);
            if (res.success) {
                setEmailStatus('success');
                setEmailMessage('Itinerary sent successfully!');
                setTimeout(() => {
                    setShowEmailModal(false);
                    setEmailStatus('idle');
                    setEmailAddress('');
                    setAttachPdf(false);
                }, 2000);
            } else {
                setEmailStatus('error');
                setEmailMessage(res.message || 'Failed to send email.');
            }
        } catch (error: any) {
            setEmailStatus('error');
            const msg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to send email.';
            setEmailMessage(msg);
        } finally {
            setIsSendingEmail(false);
        }
    };

    return (
        <>
            {/* Button Group */}
            <div className="flex items-center gap-1">
                {/* PDF Button */}
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-50"
                    title="Download PDF"
                >
                    {isGeneratingPDF ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <FileText size={20} />
                    )}
                </button>

                {/* WhatsApp Button */}
                <button
                    onClick={handleWhatsAppShare}
                    disabled={isLoadingWhatsApp}
                    className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-50"
                    title="Share via WhatsApp"
                >
                    {isLoadingWhatsApp ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <MessageCircle size={20} />
                    )}
                </button>

                {/* Email Button */}
                <button
                    onClick={() => setShowEmailModal(true)}
                    className="p-2.5 hover:bg-white/10 rounded-full text-white transition-colors"
                    title="Send via Email"
                >
                    <Mail size={20} />
                </button>
            </div>

            {/* Email Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => !isSendingEmail && setShowEmailModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6"
                        >
                            {emailStatus === 'success' ? (
                                <div className="text-center py-4">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Check size={24} className="text-green-600" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Email Sent!</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{emailMessage}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                            <Mail size={20} className="text-blue-600" />
                                            Email Itinerary
                                        </h3>
                                        <button
                                            onClick={() => setShowEmailModal(false)}
                                            disabled={isSendingEmail}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-400"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <input
                                        type="email"
                                        placeholder="recipient@example.com"
                                        value={emailAddress}
                                        onChange={(e) => setEmailAddress(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        autoFocus
                                        disabled={isSendingEmail}
                                    />

                                    {/* Attach PDF toggle */}
                                    <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={attachPdf}
                                            onChange={(e) => setAttachPdf(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            disabled={isSendingEmail}
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Attach PDF itinerary</span>
                                    </label>

                                    {/* Error message */}
                                    {emailStatus === 'error' && (
                                        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                            <span>{emailMessage}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-5 justify-end">
                                        <button
                                            onClick={() => setShowEmailModal(false)}
                                            disabled={isSendingEmail}
                                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={isSendingEmail || !emailAddress.trim()}
                                            className={clsx(
                                                "px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
                                                "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                                            )}
                                        >
                                            {isSendingEmail && <Loader2 size={14} className="animate-spin" />}
                                            Send Email
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
