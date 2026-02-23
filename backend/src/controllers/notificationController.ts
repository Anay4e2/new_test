import { Request, Response } from 'express';
import Notification from '../models/Notification';
import {
    markAsRead as markReadService,
    markAllAsRead as markAllReadService,
    getUnreadCount as getUnreadCountService,
} from '../services/notificationService';

interface AuthRequest extends Request {
    userId?: string;
}

// GET /api/notifications â€” paginated, filterable
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const {
            type,
            isRead,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
        const skip = (pageNum - 1) * limitNum;

        const query: Record<string, any> = { userId };

        if (type && typeof type === 'string') {
            query.type = type;
        }
        if (isRead !== undefined && isRead !== '') {
            query.isRead = isRead === 'true';
        }

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Notification.countDocuments(query),
        ]);

        res.json({
            success: true,
            notifications,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: pageNum * limitNum < total,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        // Verify ownership
        const notification = await Notification.findOne({ _id: id, userId });
        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }

        await markReadService(id);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
};

// PUT /api/notifications/read-all
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const count = await markAllReadService(userId);
        res.json({ success: true, markedCount: count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const count = await getUnreadCountService(userId);
        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to get unread count' });
    }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as AuthRequest).userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const result = await Notification.findOneAndDelete({ _id: id, userId });
        if (!result) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
};
