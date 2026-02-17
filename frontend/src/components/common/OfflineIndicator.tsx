import { FC, useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator: FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-amber-500 text-white text-sm font-medium text-center overflow-hidden"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <WifiOff size={16} />
                        <span>You're offline — viewing cached data</span>
                    </div>
                </motion.div>
            )}
            {showReconnected && isOnline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-green-500 text-white text-sm font-medium text-center overflow-hidden"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <Wifi size={16} />
                        <span>Back online</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
