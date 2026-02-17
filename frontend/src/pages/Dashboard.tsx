import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getMyTrips, getMyFavorites, updateTrip, deleteTrip as deleteTripApi } from '@/services/api';
import type { SavedTrip, FavoritePlace } from '@/types';
import { Star, Trash2, MapPin, Clock, ArrowLeft, Loader2, Heart, Calendar, IndianRupee } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'trips' | 'favorites';

export const Dashboard: FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [activeTab, setActiveTab] = useState<Tab>('trips');
    const [trips, setTrips] = useState<SavedTrip[]>([]);
    const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'trips') {
                const res = await getMyTrips();
                if (res.success) setTrips(res.trips);
            } else {
                const res = await getMyFavorites();
                if (res.success) setFavorites(res.favorites);
            }
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleToggleFavorite = async (trip: SavedTrip) => {
        try {
            const res = await updateTrip(trip._id, { isFavorite: !trip.isFavorite });
            if (res.success) {
                setTrips(prev => prev.map(t => t._id === trip._id ? { ...t, isFavorite: !t.isFavorite } : t));
            }
        } catch {
            // silently fail
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await deleteTripApi(id);
            if (res.success) {
                setTrips(prev => prev.filter(t => t._id !== id));
            }
        } catch {
            // silently fail
        } finally {
            setDeletingId(null);
        }
    };

    const getCities = (trip: SavedTrip): string => {
        try {
            const cities = [...new Set(trip.tripResult?.itinerary?.map((d: any) => d.city) || [])];
            return cities.join(' → ') || 'Unknown';
        } catch {
            return 'Unknown';
        }
    };

    return (
        <div className="min-h-screen bg-neutral dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Dashboard</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user?.name || 'Traveler'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/plan')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Plan New Trip
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-6 flex gap-1">
                    <button
                        onClick={() => setActiveTab('trips')}
                        className={clsx(
                            'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'trips'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        My Trips ({trips.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('favorites')}
                        className={clsx(
                            'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'favorites'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        Favorites ({favorites.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : activeTab === 'trips' ? (
                    trips.length === 0 ? (
                        <div className="text-center py-20">
                            <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No saved trips yet</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Plan your first trip and save it to see it here.</p>
                            <button onClick={() => navigate('/plan')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                                Plan a Trip
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {trips.map(trip => (
                                <div
                                    key={trip._id}
                                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                                >
                                    {/* Gradient header */}
                                    <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <h3
                                                onClick={() => navigate(`/plan?tripId=${trip._id}`)}
                                                className="font-bold text-slate-800 dark:text-white text-base cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                                            >
                                                {trip.title}
                                            </h3>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleToggleFavorite(trip)}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                                >
                                                    <Star size={16} className={clsx(trip.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trip._id)}
                                                    disabled={deletingId === trip._id}
                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-gray-300 hover:text-red-500"
                                                >
                                                    {deletingId === trip._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5 line-clamp-1">
                                            <MapPin size={13} className="shrink-0" />
                                            {getCities(trip)}
                                        </div>

                                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            {trip.tripResult?.summary?.totalCost && (
                                                <span className="flex items-center gap-0.5 font-medium text-green-600 dark:text-green-400">
                                                    <IndianRupee size={11} />
                                                    {Math.round(trip.tripResult.summary.totalCost).toLocaleString()}
                                                </span>
                                            )}
                                            {trip.tripResult?.itinerary?.length && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {trip.tripResult.itinerary.length} days
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* Favorites Tab */
                    favorites.length === 0 ? (
                        <div className="text-center py-20">
                            <Heart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No favorite places yet</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Tap the heart icon on places in your itinerary to save them here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {favorites.map(fav => (
                                <div key={fav._id} className="flex items-center gap-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
                                    <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">
                                        <Heart size={18} className="text-red-500 fill-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-slate-800 dark:text-white">{fav.placeName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                            <MapPin size={12} />
                                            {fav.cityName}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(fav.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
