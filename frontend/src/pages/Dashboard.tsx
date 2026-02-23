import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { getMyTrips, getMyFavorites, updateTrip, deleteTrip as deleteTripApi, getExpenseSummary, getMyGroups, createGroup, publishTripApi, getJournalEntryCount, cloneTripApi } from '@/services/api';
import type { SavedTrip, FavoritePlace, ExpenseSummary, TripGroup } from '@/types';
import { Star, Trash2, MapPin, Clock, ArrowLeft, Loader2, Heart, Calendar, IndianRupee, Wallet, Users, Plus, Globe, BookOpen, Copy } from 'lucide-react';
import clsx from 'clsx';
import { ExpenseTracker } from '@/components/planner/Trip/ExpenseTracker';

type Tab = 'trips' | 'favorites' | 'groups';

export const Dashboard: FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const [activeTab, setActiveTab] = useState<Tab>('trips');
    const [trips, setTrips] = useState<SavedTrip[]>([]);
    const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
    const [groups, setGroups] = useState<TripGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [creatingGroup, setCreatingGroup] = useState<string | null>(null);
    const [expandedExpenseTrip, setExpandedExpenseTrip] = useState<string | null>(null);
    const [budgetSummaries, setBudgetSummaries] = useState<Record<string, ExpenseSummary>>({});
    const [publishingTrip, setPublishingTrip] = useState<string | null>(null);
    const [publishTags, setPublishTags] = useState<string[]>([]);
    const [journalCounts, setJournalCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
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
            toast.error('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch budget summaries for all trips
    const fetchBudgetSummaries = async (tripList: SavedTrip[]) => {
        const summaries: Record<string, ExpenseSummary> = {};
        await Promise.allSettled(
            tripList.map(async (trip) => {
                try {
                    const res = await getExpenseSummary(trip._id);
                    if (res.success) summaries[trip._id] = res;
                } catch { /* ignore */ }
            })
        );
        setBudgetSummaries(summaries);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // When trips change, refresh summaries
    useEffect(() => {
        if (trips.length > 0 && activeTab === 'trips') {
            fetchBudgetSummaries(trips);
        }
    }, [trips]);

    // Fetch journal entry counts
    useEffect(() => {
        if (trips.length > 0) {
            trips.forEach(async (trip) => {
                try {
                    const res = await getJournalEntryCount(trip._id);
                    if (res.success) setJournalCounts(prev => ({ ...prev, [trip._id]: res.count }));
                } catch { /* ignore */ }
            });
        }
    }, [trips]);

    const handleToggleFavorite = async (trip: SavedTrip) => {
        try {
            const res = await updateTrip(trip._id, { isFavorite: !trip.isFavorite });
            if (res.success) {
                setTrips(prev => prev.map(t => t._id === trip._id ? { ...t, isFavorite: !t.isFavorite } : t));
            }
        } catch {
            toast.error('Failed to update favorite.');
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
            toast.error('Failed to delete trip.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleClone = async (id: string) => {
        try {
            const res = await cloneTripApi(id);
            if (res.success) {
                setTrips(prev => [res.trip, ...prev]);
                toast.success('Trip cloned!');
            }
        } catch {
            toast.error('Failed to clone trip.');
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await getMyGroups();
            if (res.success) setGroups(res.groups);
        } catch {
            toast.error('Failed to load groups.');
        }
    };

    const handleCreateGroup = async (tripId: string, tripTitle: string) => {
        setCreatingGroup(tripId);
        try {
            const res = await createGroup({ tripId, name: `${tripTitle} Group` });
            if (res.success) {
                setActiveTab('groups');
                setGroups(prev => [...prev, res.group]);
            }
        } catch {
            toast.error('Failed to create group.');
        } finally { setCreatingGroup(null); }
    };

    const getCities = (trip: SavedTrip): string => {
        try {
            const cities = [...new Set(trip.tripResult?.itinerary?.map((d: any) => d.city) || [])];
            return cities.join(' → ') || 'Unknown';
        } catch {
            return 'Unknown';
        }
    };

    const PUBLISH_TAGS = ['Solo', 'Family', 'Adventure', 'Culture', 'Food Lover', 'Budget', 'Luxury', 'Weekend', 'Pilgrimage'];

    const handlePublish = async (tripId: string, isPublic: boolean) => {
        try {
            const res = await publishTripApi(tripId, { isPublic, tags: publishTags });
            if (res.success) {
                setTrips(prev => prev.map(t => t._id === tripId ? { ...t, isPublic, tags: publishTags } : t));
                setPublishingTrip(null);
                setPublishTags([]);
            }
        } catch {
            toast.error('Failed to publish trip.');
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
                    <button
                        onClick={() => { setActiveTab('groups'); if (groups.length === 0) fetchGroups(); }}
                        className={clsx(
                            'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                            activeTab === 'groups'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        )}
                    >
                        Group Trips ({groups.length})
                    </button>
                    <button
                        onClick={() => navigate('/my-reviews')}
                        className="px-5 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors"
                    >
                        My Reviews
                    </button>
                    <button
                        onClick={() => navigate('/checklist')}
                        className="px-5 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors"
                    >
                        📋 Checklist
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
                                                    onClick={() => handleClone(trip._id)}
                                                    title="Clone trip"
                                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors text-gray-300 hover:text-blue-500"
                                                >
                                                    <Copy size={14} />
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

                                        {/* Mini budget indicator */}
                                        {budgetSummaries[trip._id] && budgetSummaries[trip._id].expenseCount > 0 && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                                                    <span>₹{budgetSummaries[trip._id].totalActual.toLocaleString()} / ₹{budgetSummaries[trip._id].totalEstimated.toLocaleString()}</span>
                                                    <span className={clsx(
                                                        'font-medium',
                                                        budgetSummaries[trip._id].percentUsed > 100 ? 'text-red-500' : budgetSummaries[trip._id].percentUsed > 80 ? 'text-amber-500' : 'text-green-500'
                                                    )}>
                                                        {budgetSummaries[trip._id].percentUsed}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={clsx(
                                                            'h-full rounded-full transition-all',
                                                            budgetSummaries[trip._id].percentUsed > 100 ? 'bg-red-500' : budgetSummaries[trip._id].percentUsed > 80 ? 'bg-amber-500' : 'bg-green-500'
                                                        )}
                                                        style={{ width: `${Math.min(budgetSummaries[trip._id].percentUsed, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Track Expenses button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedExpenseTrip(expandedExpenseTrip === trip._id ? null : trip._id);
                                            }}
                                            className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 py-2 rounded-lg transition-colors"
                                        >
                                            <Wallet size={13} />
                                            {expandedExpenseTrip === trip._id ? 'Hide Expenses' : 'Track Expenses'}
                                        </button>

                                        {/* Create Group button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCreateGroup(trip._id, trip.title); }}
                                            disabled={creatingGroup === trip._id}
                                            className="mt-1.5 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 py-2 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {creatingGroup === trip._id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                            Create Group Trip
                                        </button>

                                        {/* Publish to Community */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPublishingTrip(publishingTrip === trip._id ? null : trip._id); setPublishTags(trip.tags || []); }}
                                            className={clsx(
                                                'mt-1.5 w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors',
                                                trip.isPublic
                                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100'
                                                    : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700'
                                            )}
                                        >
                                            <Globe size={13} />
                                            {trip.isPublic ? '✅ Published' : 'Publish to Community'}
                                        </button>

                                        {/* Journal button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/journal/${trip._id}`); }}
                                            className="mt-1.5 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 py-2 rounded-lg transition-colors"
                                        >
                                            <BookOpen size={13} />
                                            📔 Journal
                                            {journalCounts[trip._id] > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-100 rounded-full text-[10px] font-bold">
                                                    {journalCounts[trip._id]}
                                                </span>
                                            )}
                                        </button>

                                        {/* Publish Tag Selector */}
                                        {publishingTrip === trip._id && (
                                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">⚠️ Your itinerary will be visible to all users</p>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {PUBLISH_TAGS.map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => setPublishTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                                                            className={clsx(
                                                                'px-2 py-0.5 text-[10px] rounded-full border transition-all',
                                                                publishTags.includes(tag)
                                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                                    : 'bg-white dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-slate-600'
                                                            )}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handlePublish(trip._id, !trip.isPublic)}
                                                        className={clsx(
                                                            'flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors',
                                                            trip.isPublic
                                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        )}
                                                    >
                                                        {trip.isPublic ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <button
                                                        onClick={() => setPublishingTrip(null)}
                                                        className="px-3 text-[11px] text-gray-500 bg-white dark:bg-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-slate-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Expense Tracker */}
                                    {expandedExpenseTrip === trip._id && (
                                        <div className="border-t border-gray-200 dark:border-slate-700 p-4">
                                            <ExpenseTracker
                                                tripId={trip._id}
                                                totalDays={trip.tripResult?.itinerary?.length || 1}
                                                cities={trip.tripResult?.itinerary?.map((d: any) => d.city)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'favorites' ? (
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
                ) : activeTab === 'groups' ? (
                    groups.length === 0 ? (
                        <div className="text-center py-20">
                            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">No group trips yet</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Create a group from one of your trips to plan together with friends!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {groups.map(g => {
                                const gTrip = typeof g.tripId === 'object' ? g.tripId as any : null;
                                const acceptedCount = g.members.filter(m => m.status === 'accepted').length;
                                return (
                                    <div
                                        key={g._id}
                                        onClick={() => navigate(`/group/${g._id}`)}
                                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                    >
                                        <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                                        <div className="p-5">
                                            <h3 className="font-bold text-slate-800 dark:text-white text-base mb-1 truncate">{g.name}</h3>
                                            {gTrip?.title && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 truncate">{gTrip.title}</p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span className="flex items-center gap-1"><Users size={12} />{acceptedCount} member{acceptedCount !== 1 ? 's' : ''}</span>
                                                <span>{g.polls.length} poll{g.polls.length !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="mt-3 flex -space-x-2">
                                                {g.members.slice(0, 5).map(m => (
                                                    <div key={m._id} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white text-[10px] font-bold" title={m.name}>
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                                {g.members.length > 5 && (
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-300">
                                                        +{g.members.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : null}
            </div>
        </div>
    );
};
