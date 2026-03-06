import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AppNotification } from '@/types';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

const NOTIFICATION_ICONS: Record<string, string> = {
    trip_reminder: '📍',
    weather_alert: '🌧️',
    price_change: '💰',
    review_prompt: '⭐',
    festival_alert: '🎉',
    system: '📢',
};

/**
 * Hook to receive real-time notifications via Socket.IO.
 * Listens for 'notification' events and pushes them into the notification store.
 */
export function useNotificationSocket(token: string | null) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('notification', (data: AppNotification) => {
            const store = useNotificationStore.getState();
            // Prepend new notification
            useNotificationStore.setState({
                notifications: [data, ...store.notifications],
                unreadCount: store.unreadCount + 1,
            });

            // Show toast for high-priority
            const icon = NOTIFICATION_ICONS[data.type] || '🔔';
            if (data.priority === 'high') {
                toast(data.title, { icon, duration: 5000 });
            } else {
                toast(data.title, { icon, duration: 3000 });
            }
        });

        socket.on('notification-read', (data: { notificationId: string }) => {
            const store = useNotificationStore.getState();
            const notification = store.notifications.find(n => n._id === data.notificationId);
            if (notification && !notification.isRead) {
                useNotificationStore.setState({
                    notifications: store.notifications.map(n =>
                        n._id === data.notificationId ? { ...n, isRead: true } : n
                    ),
                    unreadCount: Math.max(0, store.unreadCount - 1),
                });
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);
}
