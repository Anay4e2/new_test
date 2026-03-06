import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Filter, ChevronDown, Compass, Loader2, Frown } from 'lucide-react';
import clsx from 'clsx';
import { getPublicTrips, getTrendingDestinations as fetchTrending } from '@/services/api';
import type { PublicTrip, TrendingDestination } from '@/types';
import { TripCard } from '@/components/common/TripCard';
import { UserProfileModal } from '@/components/common/UserProfileModal';
import toast from 'react-hot-toast';
import { TripCardSkeleton } from '@/components/common/Skeleton';

const SORT_OPTIONS = [
    { value: 'recent', label: '🕐 Most Recent' },
    { value: 'popular', label: '❤️ Most Popular' },
    { value: 'trending', label: '🔥 Trending' },
];

const TAG_OPTIONS = ['Solo', 'Family', 'Adventure', 'Culture', 'Food Lover', 'Budget', 'Luxury', 'Weekend', 'Pilgrimage'];

const DURATION_OPTIONS = [
    { value: '', label: 'Any Duration' },
    { value: '1-3', label: '1–3 Days' },
    { value: '4-7', label: '4–7 Days' },
    { value: '8-14', label: '8–14 Days' },
    { value: '15-30', label: '15+ Days' },
];

const BUDGET_OPTIONS = [
    { value: '', label: 'Any Budget' },
    { value: 'budget', label: '💰 Budget' },
    { value: 'standard', label: '⭐ Standard' },
    { value: 'premium', label: '👑 Premium' },
];

export const Explore: FC = () => {
    const navigate = useNavigate();


    // Feed state
    const [trips, setTrips] = useState<PublicTrip[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    // Filters
    const [sort, setSort] = useState('recent');
    const [selectedTag, setSelectedTag] = useState('');
    const [duration, setDuration] = useState('');
    const [budget, setBudget] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Trending
    const [trending, setTrending] = useState<TrendingDestination[]>([]);

    // User profile modal
    const [profileUserId, setProfileUserId] = useState<string | null>(null);

    // Infinite scroll
    const observerRef = useRef<IntersectionObserver | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Fetch trips
    const fetchTrips = useCallback(async (pageNum: number, append: boolean) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await getPublicTrips({
                sort,
                tag: selectedTag || undefined,
                duration: duration || undefined,
                budget: budget || undefined,
                page: pageNum,
                limit: 10,
            });

            if (append) {
                setTrips(prev => [...prev, ...res.trips]);
            } else {
                setTrips(res.trips);
            }
            setHasMore(res.pagination.hasMore);
            setTotal(res.pagination.total);
            setPage(pageNum);
        } catch {
            toast.error('Failed to load trips.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [sort, selectedTag, duration, budget]);

    // Initial load + filter changes
    useEffect(() => {
        fetchTrips(1, false);
    }, [fetchTrips]);

    // Load trending
    useEffect(() => {
        fetchTrending().then(res => setTrending(res.destinations)).catch(() => { });
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    fetchTrips(page + 1, true);
                }
            },
            { threshold: 0.1 }
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [hasMore, loadingMore, loading, page, fetchTrips]);

    const handleTripClick = (trip: PublicTrip) => {
        // Navigate to the trip detail page if it has a share link
        navigate(`/trip/${trip._id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Hero */}
            <section className="relative py-16 px-6 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMyIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black text-white mb-4"
                    >
                        <Compass className="inline-block mr-3 mb-1" size={40} />
                        Discover Trips by Fellow Travelers
                    </motion.h1>
                    <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                        Get inspired by real itineraries crafted by the community. Find your next adventure!
                    </p>
                    <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1">🗺️ {total} trips shared</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">🔥 {trending.length} trending destinations</span>
                    </div>
                </div>
            </section>

            {/* Trending Destinations */}
            {trending.length > 0 && (
                <section className="py-8 px-6 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp size={14} /> Trending Destinations
                        </h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {trending.map((dest, i) => {
                                const gradients = ['from-blue-500 to-purple-500', 'from-emerald-500 to-cyan-500', 'from-orange-500 to-rose-500', 'from-violet-500 to-indigo-500', 'from-pink-500 to-rose-500', 'from-teal-500 to-blue-500'];
                                return (
                                    <motion.div
                                        key={dest.city}
                                        whileHover={{ scale: 1.05 }}
                                        className={clsx(
                                            'shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br text-white cursor-pointer shadow-md',
                                            gradients[i % gradients.length]
                                        )}
                                    >
                                        <div className="text-sm font-bold">{dest.city}</div>
                                        <div className="text-[10px] text-white/70">{dest.tripCount} trips • {dest.totalLikes} ❤️</div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Filters + Feed */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Duration */}
                    <div className="relative">
                        <select
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {DURATION_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Budget */}
                    <div className="relative">
                        <select
                            value={budget}
                            onChange={e => setBudget(e.target.value)}
                            className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            {BUDGET_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Expand tags */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors',
                            showFilters
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400'
                        )}
                    >
                        <Filter size={14} /> Tags
                    </button>

                    {/* Active filter count */}
                    {(selectedTag || duration || budget) && (
                        <button
                            onClick={() => { setSelectedTag(''); setDuration(''); setBudget(''); }}
                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                            Clear filters
                        </button>
                    )}

                    <span className="ml-auto text-xs text-gray-400">{total} trip{total !== 1 ? 's' : ''} found</span>
                </div>

                {/* Tag pills */}
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="flex flex-wrap gap-2 mb-6"
                    >
                        {TAG_OPTIONS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                                className={clsx(
                                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-all',
                                    selectedTag === tag
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* Trip Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <TripCardSkeleton key={i} />)}
                    </div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-20">
                        <Frown size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No trips found</h3>
                        <p className="text-sm text-gray-400">Try adjusting your filters or be the first to publish!</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trips.map(trip => (
                                <div key={trip._id} onClick={() => handleTripClick(trip)}>
                                    <TripCard
                                        trip={trip}
                                        onCreatorClick={setProfileUserId}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="h-20 flex items-center justify-center">
                            {loadingMore && (
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            )}
                            {!hasMore && trips.length > 0 && (
                                <p className="text-xs text-gray-400">You've seen all the trips! 🎉</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* User Profile Modal */}
            <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
        </div>
    );
};
