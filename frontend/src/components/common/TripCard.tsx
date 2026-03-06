import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Calendar, MapPin, IndianRupee, Eye, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { PublicTrip } from '@/types';
import { likeTripApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

interface TripCardProps {
    trip: PublicTrip;
    onCreatorClick?: (creatorId: string) => void;
}

const TAG_COLORS: Record<string, string> = {
    Solo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    Family: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Adventure: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Culture: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Food Lover': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Budget: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    Luxury: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Weekend: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    Pilgrimage: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const BUDGET_BADGE: Record<string, { label: string; class: string }> = {
    budget: { label: '💰 Budget', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    standard: { label: '⭐ Standard', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    premium: { label: '👑 Premium', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

const CITY_GRADIENTS = [
    'from-blue-600 to-purple-700',
    'from-emerald-600 to-cyan-700',
    'from-orange-600 to-rose-700',
    'from-violet-600 to-indigo-700',
    'from-pink-600 to-rose-700',
    'from-teal-600 to-blue-700',
];

export const TripCard: FC<TripCardProps> = ({ trip, onCreatorClick }) => {
    const [likes, setLikes] = useState(trip.likes);
    const [liked, setLiked] = useState(false);
    const [animating, setAnimating] = useState(false);
    const { isAuthenticated } = useAuthStore();

    const cities = [...new Set(trip.tripResult.itinerary.map(d => d.city))];
    const duration = trip.tripRequest.duration || trip.tripResult.itinerary.length;
    const budget = trip.tripRequest.budget || 'standard';
    const budgeBadge = BUDGET_BADGE[budget] || BUDGET_BADGE.standard;
    const totalCost = trip.tripResult.summary?.totalCost || 0;
    const gradientIndex = trip.title.length % CITY_GRADIENTS.length;

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!isAuthenticated()) return;

        setAnimating(true);
        try {
            const res = await likeTripApi(trip._id);
            setLiked(res.liked);
            setLikes(res.likes);
        } catch { console.warn('Failed to like trip'); }
        setTimeout(() => setAnimating(false), 400);
    };

    const handleCreatorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (trip.creator && onCreatorClick) {
            onCreatorClick(trip.creator._id);
        }
    };

    const creatorInitials = trip.creator?.name
        ? trip.creator.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-slate-700 cursor-pointer group"
        >
            {/* Cover Image / Gradient */}
            <div className={clsx('relative h-44 bg-gradient-to-br', CITY_GRADIENTS[gradientIndex])}>
                {trip.coverImage && (
                    <img src={trip.coverImage} alt={trip.title} className="absolute inset-0 w-full h-full object-cover" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1">{trip.title}</h3>
                    <div className="flex items-center gap-1.5 text-white/80 text-xs">
                        <MapPin size={12} />
                        <span className="line-clamp-1">{cities.join(' → ')}</span>
                    </div>
                </div>

                {/* Budget badge */}
                <div className="absolute top-3 right-3">
                    <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-semibold', budgeBadge.class)}>
                        {budgeBadge.label}
                    </span>
                </div>

                {/* Like button */}
                <motion.button
                    onClick={handleLike}
                    animate={animating ? { scale: [1, 1.3, 1] } : {}}
                    className="absolute top-3 left-3 p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
                >
                    <Heart
                        size={16}
                        className={clsx(
                            'transition-colors',
                            liked ? 'fill-red-500 text-red-500' : 'text-white'
                        )}
                    />
                </motion.button>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Creator */}
                {trip.creator && (
                    <button
                        onClick={handleCreatorClick}
                        className="flex items-center gap-2 mb-3 group/creator hover:opacity-80 transition-opacity"
                    >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {creatorInitials}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">
                            {trip.creator.name}
                        </span>
                    </button>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                        <Calendar size={12} /> {duration} {duration === 1 ? 'Day' : 'Days'}
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin size={12} /> {cities.length} {cities.length === 1 ? 'City' : 'Cities'}
                    </span>
                    <span className="flex items-center gap-1">
                        <IndianRupee size={12} /> ₹{Math.round(totalCost / 1000)}K
                    </span>
                </div>

                {/* Tags */}
                {trip.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {trip.tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className={clsx(
                                    'px-2 py-0.5 rounded-full text-[10px] font-medium',
                                    TAG_COLORS[tag] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                                )}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Bottom stats */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <Heart size={12} className={liked ? 'fill-red-500 text-red-500' : ''} /> {likes}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye size={12} /> Trip
                        </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={10} /> {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
