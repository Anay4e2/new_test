import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Shield, X } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const variantConfig = {
    danger: {
        icon: Trash2,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        btnBg: 'bg-red-600 hover:bg-red-700',
        btnShadow: 'shadow-red-600/20',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        btnBg: 'bg-amber-600 hover:bg-amber-700',
        btnShadow: 'shadow-amber-600/20',
    },
    info: {
        icon: Shield,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        btnBg: 'bg-blue-600 hover:bg-blue-700',
        btnShadow: 'shadow-blue-600/20',
    },
};

const ConfirmDialog: FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
}) => {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
                    >
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-6 text-center">
                            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${config.iconBg} mb-4`}>
                                <Icon className={config.iconColor} size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
                        </div>

                        <div className="flex gap-3 p-4 pt-0 justify-end">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg ${config.btnBg} ${config.btnShadow} transition-all`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
