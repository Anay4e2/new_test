import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Check, Trash2, MapPin, Cloud, Star, Megaphone, Calendar, AlertTriangle, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

import type { NotificationType } from '@/types';

const TYPE_ICON: Record<NotificationType, FC<{ size?: number; className?: string }>> = {
    trip_reminder: MapPin,
    weather_alert: Cloud,
    price_change: AlertTriangle,
    review_prompt: Star,
    festival_alert: Calendar,
    system: Megaphone,
    group_request: Users,
};

const TYPE_COLOR: Record<NotificationType, string> = {
    trip_reminder: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
    weather_alert: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
    price_change: 'text-green-500 bg-green-50 dark:bg-green-900/30',
    review_prompt: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
    festival_alert: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
    system: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
    group_request: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
};

const TYPE_LABEL: Record<NotificationType, string> = {
    trip_reminder: 'Trip Reminders',
    weather_alert: 'Weather Alerts',
    price_change: 'Price Changes',
    review_prompt: 'Review Prompts',
    festival_alert: 'Festival Alerts',
    system: 'System',
    group_request: 'Group Requests',
};

const FILTER_TABS = [
    { value: '', label: 'All' },
    { value: 'trip_reminder', label: '🗺️ Trip Reminders' },
    { value: 'weather_alert', label: '🌤️ Weather' },
    { value: 'system', label: '📢 System' },
];

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const Notifications: FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { notifications, isLoading, hasMore, fetchNotifications, loadMore, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotificationStore();
    const [typeFilter, setTypeFilter] = useState('');
    const [swipingId, setSwipingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchNotifications(true);
    }, []);

    // Re-fetch when filter changes
    useEffect(() => {
        fetchNotifications(true);
    }, [typeFilter]);

    const filteredNotifications = typeFilter
        ? notifications.filter(n => n.type === typeFilter)
        : notifications;

    const handleSwipeStart = (id: string) => setSwipingId(id);
    const handleSwipeDelete = (id: string) => {
        deleteNotification(id);
        setSwipingId(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
                <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Bell size={20} className="text-blue-600" />
                            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                            )}
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            <Check size={12} /> Read all
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="max-w-3xl mx-auto px-6 pt-6 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {FILTER_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setTypeFilter(tab.value)}
                            className={clsx(
                                'px-4 py-2 text-xs font-medium rounded-full border whitespace-nowrap transition-all',
                                typeFilter === tab.value
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notification List */}
            <div className="max-w-3xl mx-auto px-6 pb-10">
                {isLoading && filteredNotifications.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-20">
                        <Bell size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">All caught up!</h3>
                        <p className="text-sm text-gray-400">No new notifications.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {filteredNotifications.map((n) => {
                                const Icon = TYPE_ICON[n.type] || Megaphone;
                                return (
                                    <motion.div
                                        key={n._id}
                                        layout
                                        initial={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -300, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="relative overflow-hidden"
                                    >
                                        {/* Swipe delete background */}
                                        {swipingId === n._id && (
                                            <div className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end pr-6">
                                                <Trash2 size={20} className="text-white" />
                                            </div>
                                        )}

                                        <div
                                            onClick={() => {
                                                if (!n.isRead) markAsRead(n._id);
                                                if (n.actionUrl) navigate(n.actionUrl);
                                            }}
                                            onTouchStart={() => handleSwipeStart(n._id)}
                                            onTouchEnd={() => {
                                                if (swipingId === n._id) {
                                                    handleSwipeDelete(n._id);
                                                }
                                            }}
                                            className={clsx(
                                                'relative bg-white dark:bg-slate-900 border rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-all group',
                                                n.isRead
                                                    ? 'border-gray-100 dark:border-slate-800'
                                                    : 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10',
                                                n.priority === 'high' && !n.isRead && 'ring-1 ring-red-200 dark:ring-red-800'
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className={clsx('shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', TYPE_COLOR[n.type])}>
                                                <Icon size={18} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={clsx('text-sm line-clamp-1', n.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-slate-800 dark:text-white font-semibold')}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[10px] text-gray-300 dark:text-gray-600 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded">{TYPE_LABEL[n.type]}</span>
                                                    {n.priority === 'high' && (
                                                        <span className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded font-medium">Urgent</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="shrink-0 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!n.isRead && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                                                        className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-500"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-300 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            {/* Unread dot */}
                                            {!n.isRead && (
                                                <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Load more */}
                        {hasMore && (
                            <div className="text-center pt-4">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin inline mr-1" /> : null}
                                    Load more
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
