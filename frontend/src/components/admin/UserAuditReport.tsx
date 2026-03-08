import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Users, BookOpen, Star, Heart, Receipt, Mail, Send, Bell, Globe, Lock, Calendar, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface UserAuditReportProps {
    userId: string;
    onBack: () => void;
}

interface AuditTrip {
    _id: string;
    title: string;
    isPublic: boolean;
    isFavorite: boolean;
    likes: number;
    tags: string[];
    isGroupTrip: boolean;
    createdAt: string;
    tripResult?: { summary?: { totalCost?: number; totalDistance?: number; feasibility?: string } };
    tripRequest?: { duration?: number; budget?: string; selectedCityIds?: string[] };
}

interface AuditGroup {
    _id: string;
    name: string;
    tripId: any;
    members: Array<{ email: string; name: string; role: string; status: string }>;
    maxMembers?: number;
    ownerId?: any;
    createdAt: string;
}

interface AuditJournal {
    _id: string;
    tripId: string;
    day: number;
    city: string;
    title: string;
    mood: string;
    isPublic: boolean;
    createdAt: string;
}

interface AuditReview {
    _id: string;
    placeName: string;
    cityName: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: string;
}

interface AuditFavorite {
    _id: string;
    placeName: string;
    cityName: string;
    addedAt: string;
}

interface AuditExpense {
    _id: string;
    category: string;
    amount: number;
    description: string;
    day: number;
    city?: string;
    paymentMethod: string;
    createdAt: string;
}

interface AuditData {
    user: { _id: string; name: string; email: string; role: string; provider?: string; isVerified: boolean; interests?: string[]; createdAt: string };
    summary: {
        totalTrips: number; publicTrips: number; groupTripsOwned: number; groupTripsJoined: number;
        totalJournals: number; totalReviews: number; averageRating: number;
        totalFavorites: number; totalExpense: number; totalPostcards: number; totalContactQueries: number;
    };
    trips: AuditTrip[];
    groupsOwned: AuditGroup[];
    groupsJoined: AuditGroup[];
    journals: AuditJournal[];
    reviews: AuditReview[];
    favorites: AuditFavorite[];
    expenses: AuditExpense[];
    expenseSummary: { total: number; byCategory: Record<string, number>; byPaymentMethod: Record<string, number> };
    contactQueries: Array<{ _id: string; subject: string; status: string; createdAt: string }>;
    postcards: Array<{ _id: string; city: string; message: string; createdAt: string }>;
    notifications: Array<{ _id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string }>;
}

type Section = 'overview' | 'trips' | 'groups' | 'journals' | 'reviews' | 'favorites' | 'expenses' | 'contact' | 'notifications';

const sectionConfig: Array<{ id: Section; label: string; icon: FC<{ size?: number; className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'trips', label: 'Trips', icon: MapPin },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'journals', label: 'Journals', icon: BookOpen },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
];

const moodEmojis: Record<string, string> = { amazing: '🤩', happy: '😊', neutral: '😐', tired: '😴', challenging: '💪' };

const UserAuditReport: FC<UserAuditReportProps> = ({ userId, onBack }) => {
    const [data, setData] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<Section>('overview');

    useEffect(() => {
        const fetchAudit = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/admin/users/${userId}/audit`);
                setData(response.data);
            } catch {
                toast.error('Failed to load user audit report');
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-500 dark:text-slate-400">Failed to load audit data.</p>
                <button onClick={onBack} className="mt-4 text-blue-600 hover:underline text-sm">Go back</button>
            </div>
        );
    }

    const { user, summary } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {user.email} · {user.provider || 'local'} · {user.isVerified ? '✓ Verified' : '✗ Unverified'} · Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                    {user.role.toUpperCase()}
                </span>
            </div>

            {/* Section Nav */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {sectionConfig.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveSection(id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            activeSection === id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {activeSection === 'overview' && <OverviewSection summary={summary} data={data} />}
                    {activeSection === 'trips' && <TripsSection trips={data.trips} />}
                    {activeSection === 'groups' && <GroupsSection groupsOwned={data.groupsOwned} groupsJoined={data.groupsJoined} />}
                    {activeSection === 'journals' && <JournalsSection journals={data.journals} />}
                    {activeSection === 'reviews' && <ReviewsSection reviews={data.reviews} />}
                    {activeSection === 'favorites' && <FavoritesSection favorites={data.favorites} />}
                    {activeSection === 'expenses' && <ExpensesSection expenses={data.expenses} expenseSummary={data.expenseSummary} />}
                    {activeSection === 'contact' && <ContactSection contactQueries={data.contactQueries} postcards={data.postcards} />}
                    {activeSection === 'notifications' && <NotificationsSection notifications={data.notifications} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

/* ─── Overview ─── */
const OverviewSection: FC<{ summary: AuditData['summary']; data: AuditData }> = ({ summary, data }) => {
    const stats = [
        { label: 'Total Trips', value: summary.totalTrips, color: 'blue', icon: MapPin },
        { label: 'Public Trips', value: summary.publicTrips, color: 'green', icon: Globe },
        { label: 'Groups Owned', value: summary.groupTripsOwned, color: 'purple', icon: Users },
        { label: 'Groups Joined', value: summary.groupTripsJoined, color: 'indigo', icon: Users },
        { label: 'Journals', value: summary.totalJournals, color: 'amber', icon: BookOpen },
        { label: 'Reviews', value: summary.totalReviews, color: 'orange', icon: Star },
        { label: 'Avg Rating', value: summary.averageRating, color: 'yellow', icon: Star },
        { label: 'Favorites', value: summary.totalFavorites, color: 'pink', icon: Heart },
        { label: 'Total Expense', value: `₹${summary.totalExpense.toLocaleString('en-IN')}`, color: 'emerald', icon: IndianRupee },
        { label: 'Postcards', value: summary.totalPostcards, color: 'cyan', icon: Send },
        { label: 'Contact Queries', value: summary.totalContactQueries, color: 'red', icon: Mail },
    ];

    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
        green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
        yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800',
        pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
        cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800',
        red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className={`rounded-xl border p-4 ${colorMap[s.color]}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={16} />
                                <span className="text-xs font-medium opacity-80">{s.label}</span>
                            </div>
                            <p className="text-xl font-bold">{s.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Interests */}
            {data.user.interests && data.user.interests.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.user.interests.map((i) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs">{i}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Recent Activity</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {[
                        ...data.trips.slice(0, 5).map(t => ({ type: 'trip' as const, label: `Created trip: ${t.title}${t.isGroupTrip ? ' (Group)' : ''}`, date: t.createdAt })),
                        ...data.reviews.slice(0, 5).map(r => ({ type: 'review' as const, label: `Reviewed ${r.placeName} (${r.rating}★)`, date: r.createdAt })),
                        ...data.journals.slice(0, 5).map(j => ({ type: 'journal' as const, label: `Journal: ${j.title} in ${j.city}`, date: j.createdAt })),
                        ...data.favorites.slice(0, 5).map(f => ({ type: 'favorite' as const, label: `Favorited ${f.placeName}`, date: f.addedAt })),
                    ]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 15)
                        .map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    item.type === 'trip' ? 'bg-blue-500' : item.type === 'review' ? 'bg-orange-500' : item.type === 'journal' ? 'bg-amber-500' : 'bg-pink-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.label}</p>
                                    <p className="text-[10px] text-slate-400">{new Date(item.date).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    {data.trips.length === 0 && data.reviews.length === 0 && data.journals.length === 0 && data.favorites.length === 0 && (
                        <p className="text-sm text-slate-400">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ─── Trips ─── */
const TripsSection: FC<{ trips: AuditTrip[] }> = ({ trips }) => (
    <div className="space-y-3">
        {trips.length === 0 ? (
            <EmptyState icon={MapPin} message="No trips created yet" />
        ) : (
            trips.map((t) => (
                <div key={t._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{t.title}</h4>
                                {t.isGroupTrip && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">GROUP</span>
                                )}
                                {t.isPublic ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><Globe className="inline w-3 h-3 mr-0.5" />Public</span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"><Lock className="inline w-3 h-3 mr-0.5" />Private</span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                <span><Calendar className="inline w-3 h-3 mr-1" />{new Date(t.createdAt).toLocaleDateString()}</span>
                                {t.tripRequest?.duration && <span>{t.tripRequest.duration} days</span>}
                                {t.tripRequest?.budget && <span className="capitalize">{t.tripRequest.budget}</span>}
                                {t.tripResult?.summary?.totalCost != null && <span>₹{t.tripResult.summary.totalCost.toLocaleString('en-IN')}</span>}
                                <span>❤ {t.likes} likes</span>
                                {t.isFavorite && <span>⭐ Favorited</span>}
                            </div>
                            {t.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {t.tags.map(tag => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-[10px]">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

/* ─── Groups ─── */
const GroupsSection: FC<{ groupsOwned: AuditGroup[]; groupsJoined: AuditGroup[] }> = ({ groupsOwned, groupsJoined }) => (
    <div className="space-y-6">
        {/* Owned Groups */}
        <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Users size={16} className="text-purple-500" /> Groups Owned ({groupsOwned.length})
            </h4>
            {groupsOwned.length === 0 ? (
                <p className="text-sm text-slate-400">No groups created</p>
            ) : (
                <div className="space-y-2">
                    {groupsOwned.map(g => (
                        <div key={g._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{g.name}</h5>
                                <span className="text-[10px] text-slate-400">{new Date(g.createdAt).toLocaleDateString()}</span>
                            </div>
                            {g.tripId && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Trip: {(g.tripId as any).title || '—'}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                                {g.members.map((m, i) => (
                                    <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        m.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : m.status === 'declined' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {m.name} ({m.role}) — {m.status}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Joined Groups */}
        <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Users size={16} className="text-indigo-500" /> Groups Joined ({groupsJoined.length})
            </h4>
            {groupsJoined.length === 0 ? (
                <p className="text-sm text-slate-400">Not a member of any groups</p>
            ) : (
                <div className="space-y-2">
                    {groupsJoined.map(g => (
                        <div key={g._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{g.name}</h5>
                                <span className="text-[10px] text-slate-400">{new Date(g.createdAt).toLocaleDateString()}</span>
                            </div>
                            {g.tripId && <p className="text-xs text-slate-500 dark:text-slate-400">Trip: {(g.tripId as any).title || '—'}</p>}
                            {g.ownerId && <p className="text-xs text-slate-500 dark:text-slate-400">Owner: {(g.ownerId as any).name || '—'} ({(g.ownerId as any).email || ''})</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

/* ─── Journals ─── */
const JournalsSection: FC<{ journals: AuditJournal[] }> = ({ journals }) => (
    <div className="space-y-2">
        {journals.length === 0 ? (
            <EmptyState icon={BookOpen} message="No journal entries yet" />
        ) : (
            journals.map(j => (
                <div key={j._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                    <span className="text-xl">{moodEmojis[j.mood] || '😊'}</span>
                    <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{j.title}</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Day {j.day} · {j.city} · {j.isPublic ? 'Public' : 'Private'}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(j.createdAt).toLocaleDateString()}</span>
                </div>
            ))
        )}
    </div>
);

/* ─── Reviews ─── */
const ReviewsSection: FC<{ reviews: AuditReview[] }> = ({ reviews }) => (
    <div className="space-y-2">
        {reviews.length === 0 ? (
            <EmptyState icon={Star} message="No reviews yet" />
        ) : (
            reviews.map(r => (
                <div key={r._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{r.placeName}</h5>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{r.cityName}</p>
                            <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <Star key={i} size={12} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'} />
                                ))}
                            </div>
                            {r.title && <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">{r.title}</p>}
                            {r.comment && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{r.comment}</p>}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ))
        )}
    </div>
);

/* ─── Favorites ─── */
const FavoritesSection: FC<{ favorites: AuditFavorite[] }> = ({ favorites }) => (
    <div className="space-y-2">
        {favorites.length === 0 ? (
            <EmptyState icon={Heart} message="No favorite places yet" />
        ) : (
            favorites.map(f => (
                <div key={f._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                    <Heart size={14} className="text-pink-500 fill-pink-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{f.placeName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{f.cityName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(f.addedAt).toLocaleDateString()}</span>
                </div>
            ))
        )}
    </div>
);

/* ─── Expenses ─── */
const ExpensesSection: FC<{ expenses: AuditExpense[]; expenseSummary: AuditData['expenseSummary'] }> = ({ expenses, expenseSummary }) => (
    <div className="space-y-4">
        {/* Summary Cards */}
        {expenseSummary.total > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">By Category</h5>
                    <div className="space-y-1.5">
                        {Object.entries(expenseSummary.byCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => (
                            <div key={cat} className="flex justify-between text-sm">
                                <span className="capitalize text-slate-600 dark:text-slate-300">{cat}</span>
                                <span className="font-medium text-slate-900 dark:text-white">₹{amt.toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-1.5 mt-1.5 flex justify-between text-sm font-bold">
                            <span className="text-slate-700 dark:text-slate-200">Total</span>
                            <span className="text-emerald-600">₹{expenseSummary.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">By Payment Method</h5>
                    <div className="space-y-1.5">
                        {Object.entries(expenseSummary.byPaymentMethod).sort(([,a],[,b]) => b - a).map(([method, amt]) => (
                            <div key={method} className="flex justify-between text-sm">
                                <span className="capitalize text-slate-600 dark:text-slate-300">{method}</span>
                                <span className="font-medium text-slate-900 dark:text-white">₹{amt.toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Expense List */}
        {expenses.length === 0 ? (
            <EmptyState icon={Receipt} message="No expenses recorded" />
        ) : (
            <div className="space-y-2">
                {expenses.map(e => (
                    <div key={e._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{e.category}</span>
                                {e.city && <span className="text-xs text-slate-400">{e.city}</span>}
                                <span className="text-xs text-slate-400">Day {e.day}</span>
                            </div>
                            {e.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{e.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">₹{e.amount.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{e.paymentMethod}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

/* ─── Contact + Postcards ─── */
const ContactSection: FC<{ contactQueries: AuditData['contactQueries']; postcards: AuditData['postcards'] }> = ({ contactQueries, postcards }) => (
    <div className="space-y-6">
        <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Mail size={16} className="text-red-500" /> Contact Queries ({contactQueries.length})
            </h4>
            {contactQueries.length === 0 ? (
                <p className="text-sm text-slate-400">No contact queries</p>
            ) : (
                <div className="space-y-2">
                    {contactQueries.map(q => (
                        <div key={q._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{q.subject}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                q.status === 'new' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : q.status === 'in-progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            }`}>{q.status}</span>
                            <span className="text-[10px] text-slate-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Send size={16} className="text-cyan-500" /> Postcards ({postcards.length})
            </h4>
            {postcards.length === 0 ? (
                <p className="text-sm text-slate-400">No postcards sent</p>
            ) : (
                <div className="space-y-2">
                    {postcards.map(p => (
                        <div key={p._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{p.city}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.message}</p>
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

/* ─── Notifications ─── */
const NotificationsSection: FC<{ notifications: AuditData['notifications'] }> = ({ notifications }) => (
    <div className="space-y-2">
        {notifications.length === 0 ? (
            <EmptyState icon={Bell} message="No notifications" />
        ) : (
            notifications.map(n => (
                <div key={n._id} className={`bg-white dark:bg-slate-800 rounded-xl border p-3 flex items-start gap-3 ${
                    n.isRead ? 'border-slate-200 dark:border-slate-700 opacity-60' : 'border-blue-200 dark:border-blue-800'
                }`}>
                    <Bell size={14} className={`mt-0.5 shrink-0 ${n.isRead ? 'text-slate-400' : 'text-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{n.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${n.isRead ? 'text-slate-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {n.isRead ? 'Read' : 'Unread'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            ))
        )}
    </div>
);

/* ─── Empty State Helper ─── */
const EmptyState: FC<{ icon: FC<{ size?: number; className?: string }>; message: string }> = ({ icon: Icon, message }) => (
    <div className="text-center py-12">
        <Icon size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-sm text-slate-400 dark:text-slate-500">{message}</p>
    </div>
);

export default UserAuditReport;
