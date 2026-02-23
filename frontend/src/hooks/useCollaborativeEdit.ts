import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface Collaborator {
    userId: string;
    userName: string;
    dayIndex?: number;
    activityIndex?: number;
}

interface TripEdit {
    tripId: string;
    userId: string;
    action: string;
    payload: any;
}

export function useCollaborativeEdit(tripId: string | undefined, token: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const [collaborators, setCollaborators] = useState<Map<string, Collaborator>>(new Map());
    const [connected, setConnected] = useState(false);
    const [lastEdit, setLastEdit] = useState<TripEdit | null>(null);

    useEffect(() => {
        if (!tripId || !token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-trip', tripId);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('collaborator-joined', (data: { tripId: string; userId: string; userName: string }) => {
            if (data.tripId === tripId) {
                setCollaborators(prev => {
                    const next = new Map(prev);
                    next.set(data.userId, { userId: data.userId, userName: data.userName });
                    return next;
                });
            }
        });

        socket.on('collaborator-left', (data: { tripId: string; userId: string }) => {
            if (data.tripId === tripId) {
                setCollaborators(prev => {
                    const next = new Map(prev);
                    next.delete(data.userId);
                    return next;
                });
            }
        });

        socket.on('trip-edited', (data: TripEdit) => {
            if (data.tripId === tripId) {
                setLastEdit(data);
            }
        });

        socket.on('collaborator-cursor', (data: { tripId: string; userId: string; dayIndex: number; activityIndex?: number }) => {
            if (data.tripId === tripId) {
                setCollaborators(prev => {
                    const next = new Map(prev);
                    const existing = next.get(data.userId);
                    if (existing) {
                        next.set(data.userId, { ...existing, dayIndex: data.dayIndex, activityIndex: data.activityIndex });
                    }
                    return next;
                });
            }
        });

        return () => {
            socket.emit('leave-trip', tripId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [tripId, token]);

    const emitEdit = useCallback((action: string, payload: any) => {
        socketRef.current?.emit('trip-edit', { tripId, action, payload });
    }, [tripId]);

    const emitCursor = useCallback((dayIndex: number, activityIndex?: number) => {
        socketRef.current?.emit('trip-cursor', { tripId, dayIndex, activityIndex });
    }, [tripId]);

    return {
        connected,
        collaborators: Array.from(collaborators.values()),
        lastEdit,
        emitEdit,
        emitCursor,
    };
}
