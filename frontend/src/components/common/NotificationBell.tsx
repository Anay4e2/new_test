import { FC, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, MapPin, Cloud, Star, Megaphone, Calendar, AlertTriangle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import type { NotificationType } from '@/types';

const ICON_MAP: Record<NotificationType, FC<{ size?: number; className?: string }>> = {
    trip_reminder: MapPin,
    weather_alert: Cloud,
    price_change: AlertTriangle,
    review_prompt: Star,
    festival_alert: Calendar,
    system: Megaphone,
    group_request: Users,
};

const COLOR_MAP: Record<NotificationType, string> = {
    trip_reminder: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
    weather_alert: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
    price_change: 'text-green-500 bg-green-50 dark:bg-green-900/30',
    review_prompt: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
    festival_alert: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
    system: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
    group_request: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const NotificationBell: FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { unreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead, startPolling, stopPolling } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Start polling when authenticated
    useEffect(() => {
        if (isAuthenticated()) {
            startPolling();
            return () => stopPolling();
        }
    }, [isAuthenticated, startPolling, stopPolling]);

    // Fetch full list when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications(true);
        }
    }, [isOpen, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!isAuthenticated()) return null;

    const recentNotifications = notifications.slice(0, 7);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-[calc(100vw-1rem)] max-w-sm sm:w-96 sm:max-w-none max-h-[480px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <Check size={12} /> Mark all as read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto max-h-[360px]">
                            {recentNotifications.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Bell size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm text-gray-400">All caught up!</p>
                                </div>
                            ) : (
                                recentNotifications.map(n => {
                                    const Icon = ICON_MAP[n.type] || Megaphone;
                                    return (
                                        <button
                                            key={n._id}
                                            onClick={() => {
                                                if (!n.isRead) markAsRead(n._id);
                                                if (n.actionUrl) navigate(n.actionUrl);
                                                setIsOpen(false);
                                            }}
                                            className={clsx(
                                                'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b border-gray-50 dark:border-slate-800/50',
                                                !n.isRead && 'bg-blue-50/40 dark:bg-blue-900/10'
                                            )}
                                        >
                                            <div className={clsx('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', COLOR_MAP[n.type])}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={clsx('text-sm line-clamp-1', n.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-slate-800 dark:text-white font-semibold')}>
                                                    {n.title}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                                                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                                            </div>
                                            {!n.isRead && (
                                                <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 dark:border-slate-800 px-4 py-2.5">
                            <button
                                onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                                className="w-full text-center text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                                View all notifications
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
