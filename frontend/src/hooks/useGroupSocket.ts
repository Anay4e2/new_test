import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GroupChat } from '../types';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

export function useGroupSocket(groupId: string | undefined, token: string | null) {
    const socketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<GroupChat[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!groupId || !token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join-group', groupId);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('new-message', (data: { groupId: string; message: GroupChat }) => {
            if (data.groupId === groupId) {
                setMessages(prev => [...prev, data.message]);
            }
        });

        socket.on('user-typing', (data: { groupId: string; userId: string; userName: string }) => {
            if (data.groupId === groupId) {
                setTypingUsers(prev => new Map(prev).set(data.userId, data.userName));
            }
        });

        socket.on('user-stop-typing', (data: { groupId: string; userId: string }) => {
            if (data.groupId === groupId) {
                setTypingUsers(prev => {
                    const next = new Map(prev);
                    next.delete(data.userId);
                    return next;
                });
            }
        });

        return () => {
            socket.emit('leave-group', groupId);
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [groupId, token]);

    const sendMessage = useCallback((message: string) => {
        if (socketRef.current && groupId) {
            socketRef.current.emit('chat-message', { groupId, message });
        }
    }, [groupId]);

    const sendTyping = useCallback((userName: string) => {
        if (socketRef.current && groupId) {
            socketRef.current.emit('typing', { groupId, userName });
        }
    }, [groupId]);

    const stopTyping = useCallback(() => {
        if (socketRef.current && groupId) {
            socketRef.current.emit('stop-typing', { groupId });
        }
    }, [groupId]);

    const setInitialMessages = useCallback((msgs: GroupChat[]) => {
        setMessages(msgs);
    }, []);

    return { messages, connected, typingUsers, sendMessage, sendTyping, stopTyping, setInitialMessages };
}
