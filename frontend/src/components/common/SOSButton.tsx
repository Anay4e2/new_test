import { FC, useState } from 'react';
import { Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SOSButtonProps {
    visible?: boolean;
}

export const SOSButton: FC<SOSButtonProps> = ({ visible = true }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!visible) return null;

    const emergencyNumbers = [
        { label: 'Police', number: '100', icon: '🚔', color: 'bg-blue-600 hover:bg-blue-700' },
        { label: 'Ambulance', number: '108', icon: '🚑', color: 'bg-red-600 hover:bg-red-700' },
        { label: 'Fire', number: '101', icon: '🚒', color: 'bg-orange-600 hover:bg-orange-700' },
        { label: 'Tourist Help', number: '1363', icon: '📞', color: 'bg-green-600 hover:bg-green-700' },
        { label: 'Women Help', number: '1091', icon: '👩', color: 'bg-purple-600 hover:bg-purple-700' },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-2 mb-2"
                    >
                        {emergencyNumbers.map((item) => (
                            <motion.a
                                key={item.number}
                                href={`tel:${item.number}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.15 }}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-white shadow-lg ${item.color} transition-all active:scale-95 min-w-[160px]`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] opacity-80 leading-none">{item.label}</p>
                                    <p className="text-sm font-bold leading-tight">{item.number}</p>
                                </div>
                                <Phone size={14} className="opacity-70" />
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main SOS button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${isOpen
                        ? 'bg-gray-700 hover:bg-gray-800'
                        : 'bg-red-600 hover:bg-red-700 animate-pulse'
                    }`}
                style={{ minWidth: 56, minHeight: 56 }}
                aria-label={isOpen ? 'Close emergency contacts' : 'Open emergency contacts'}
            >
                {isOpen ? (
                    <span className="text-white text-xl font-bold">✕</span>
                ) : (
                    <span className="text-white text-sm font-black tracking-wide">SOS</span>
                )}
            </motion.button>
        </div>
    );
};
