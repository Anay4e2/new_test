import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Star, Heart, Calendar } from 'lucide-react';
import { getUserPublicProfile } from '@/services/api';
import type { UserPublicProfile } from '@/types';

interface UserProfileModalProps {
    userId: string | null;
    onClose: () => void;
}

export const UserProfileModal: FC<UserProfileModalProps> = ({ userId, onClose }) => {
    const [profile, setProfile] = useState<UserPublicProfile | null>(null);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        getUserPublicProfile(userId)
            .then(res => {
                setProfile(res.profile);
                setTrips(res.trips);
            })
            .catch(() => setProfile(null))
            .finally(() => setLoading(false));
    }, [userId]);

    if (!userId) return null;

    const initials = profile?.name
        ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

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
                    className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 p-6 pb-16">
                        <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={18} className="text-white" />
                        </button>
                    </div>

                    {/* Avatar */}
                    <div className="flex justify-center -mt-10 relative z-10">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {loading ? '...' : initials}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto p-6 pt-3">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                            </div>
                        ) : profile ? (
                            <>
                                <div className="text-center mb-5">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{profile.name}</h3>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                                        <Calendar size={10} /> Member since {new Date(profile.memberSince).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{profile.tripCount}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">Trips</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-black text-red-500">{profile.totalLikes}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">Likes</div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-black text-amber-500">{profile.reviewCount}</div>
                                        <div className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">Reviews</div>
                                    </div>
                                </div>

                                {/* Trips */}
                                {trips.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">Public Trips</h4>
                                        <div className="space-y-2">
                                            {trips.map((t: any) => {
                                                const itinerary = t.tripResult?.itinerary || [];
                                                const cities = [...new Set(itinerary.map((d: any) => d.city))] as string[];
                                                return (
                                                    <div key={t._id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                                                            <MapPin size={16} className="text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-700 dark:text-white truncate">{t.title}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{cities.join(' → ')}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                                            <Heart size={10} /> {t.likes || 0}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Star size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm">User not found</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
