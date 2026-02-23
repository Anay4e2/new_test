import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config/auth';
import TripGroup from './models/TripGroup';
import User from './models/User';

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
            credentials: true,
        },
        path: '/socket.io',
    });

    // Auth middleware — verify JWT before allowing connections
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            (socket as any).userId = decoded.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId as string;

        // Join a group chat room
        socket.on('join-group', async (groupId: string) => {
            if (!groupId) return;

            try {
                const user = await User.findById(userId);
                if (!user) return;

                const group = await TripGroup.findById(groupId);
                if (!group) return;

                // Verify membership
                const isMember = group.ownerId.toString() === userId ||
                    group.members.some(m =>
                        (m.userId && m.userId.toString() === userId) ||
                        m.email === user.email
                    );

                if (!isMember) return;

                socket.join(`group:${groupId}`);
            } catch {
                // Silently fail for invalid group
            }
        });

        // Leave a group chat room
        socket.on('leave-group', (groupId: string) => {
            socket.leave(`group:${groupId}`);
        });

        // Send a chat message
        socket.on('chat-message', async (data: { groupId: string; message: string }) => {
            const { groupId, message } = data;
            if (!groupId || !message?.trim()) return;

            try {
                const user = await User.findById(userId);
                const group = await TripGroup.findById(groupId);
                if (!group || !user) return;

                // Verify accepted membership
                const member = group.members.find(
                    m => m.userId && m.userId.toString() === userId && m.status === 'accepted'
                );
                if (!member) return;

                const chatMessage = {
                    userId: userId,
                    userName: user.name,
                    message: message.trim(),
                    timestamp: new Date(),
                };

                group.chat.push(chatMessage as any);

                // Keep last 500 messages
                if (group.chat.length > 500) {
                    group.chat = group.chat.slice(-500) as any;
                }

                await group.save();

                const savedMessage = group.chat[group.chat.length - 1];

                // Broadcast to all members in the room
                io!.to(`group:${groupId}`).emit('new-message', {
                    groupId,
                    message: savedMessage,
                });
            } catch {
                socket.emit('chat-error', { message: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('typing', (data: { groupId: string; userName: string }) => {
            if (data.groupId) {
                socket.to(`group:${data.groupId}`).emit('user-typing', {
                    groupId: data.groupId,
                    userId,
                    userName: data.userName,
                });
            }
        });

        socket.on('stop-typing', (data: { groupId: string }) => {
            if (data.groupId) {
                socket.to(`group:${data.groupId}`).emit('user-stop-typing', {
                    groupId: data.groupId,
                    userId,
                });
            }
        });

        // ─── Collaborative Trip Editing ───

        // Join a trip editing session
        socket.on('join-trip', async (tripId: string) => {
            if (!tripId) return;
            socket.join(`trip:${tripId}`);

            const user = await User.findById(userId).select('name').lean();
            socket.to(`trip:${tripId}`).emit('collaborator-joined', {
                tripId,
                userId,
                userName: user?.name || 'Unknown',
            });
        });

        // Leave a trip editing session
        socket.on('leave-trip', (tripId: string) => {
            if (!tripId) return;
            socket.leave(`trip:${tripId}`);
            socket.to(`trip:${tripId}`).emit('collaborator-left', {
                tripId,
                userId,
            });
        });

        // Broadcast itinerary edits (activity reorder, add, remove, update)
        socket.on('trip-edit', (data: { tripId: string; action: string; payload: any }) => {
            if (!data.tripId) return;
            socket.to(`trip:${data.tripId}`).emit('trip-edited', {
                tripId: data.tripId,
                userId,
                action: data.action,
                payload: data.payload,
            });
        });

        // Cursor / selection presence
        socket.on('trip-cursor', (data: { tripId: string; dayIndex: number; activityIndex?: number }) => {
            if (!data.tripId) return;
            socket.to(`trip:${data.tripId}`).emit('collaborator-cursor', {
                tripId: data.tripId,
                userId,
                dayIndex: data.dayIndex,
                activityIndex: data.activityIndex,
            });
        });
    });

    return io;
}

export function getIO(): Server | null {
    return io;
}
