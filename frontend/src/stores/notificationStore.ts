import { create } from 'zustand';
import toast from 'react-hot-toast';
import type { AppNotification } from '@/types';
import { getNotificationsApi, getUnreadCountApi, markNotificationReadApi, markAllNotificationsReadApi, deleteNotificationApi } from '@/services/api';

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;
    page: number;

    // Actions
    fetchNotifications: (reset?: boolean) => Promise<void>;
    loadMore: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    pollUnreadCount: () => Promise<void>;
    startPolling: () => void;
    stopPolling: () => void;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useNotificationStore = create<NotificationState>()((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: true,
    page: 1,

    fetchNotifications: async (reset = true) => {
        set({ isLoading: true });
        try {
            const pageNum = reset ? 1 : get().page;
            const res = await getNotificationsApi({ page: pageNum, limit: 20 });
            if (res.success) {
                set({
                    notifications: reset ? res.notifications : [...get().notifications, ...res.notifications],
                    hasMore: res.pagination.hasMore,
                    page: pageNum,
                });
            }
        } catch { console.warn('Failed to fetch notifications'); }
        set({ isLoading: false });
    },

    loadMore: async () => {
        const { hasMore, isLoading, page } = get();
        if (!hasMore || isLoading) return;
        set({ page: page + 1 });
        await get().fetchNotifications(false);
    },

    markAsRead: async (id: string) => {
        try {
            await markNotificationReadApi(id);
            set({
                notifications: get().notifications.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, get().unreadCount - 1),
            });
        } catch { toast.error('Failed to mark notification as read.'); }
    },

    markAllAsRead: async () => {
        try {
            await markAllNotificationsReadApi();
            set({
                notifications: get().notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0,
            });
        } catch { toast.error('Failed to mark all as read.'); }
    },

    deleteNotification: async (id: string) => {
        try {
            await deleteNotificationApi(id);
            const deleted = get().notifications.find(n => n._id === id);
            set({
                notifications: get().notifications.filter(n => n._id !== id),
                unreadCount: deleted && !deleted.isRead ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
            });
        } catch { toast.error('Failed to delete notification.'); }
    },

    pollUnreadCount: async () => {
        try {
            const res = await getUnreadCountApi();
            if (res.success) {
                set({ unreadCount: res.count });
            }
        } catch { console.warn('Failed to poll unread count'); }
    },

    startPolling: () => {
        // Fetch immediately
        get().pollUnreadCount();

        // Poll every 60 seconds
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(() => {
            get().pollUnreadCount();
        }, 60_000);
    },

    stopPolling: () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    },
}));
