import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import SharedTrip from '../models/SharedTrip';
import { AuthRequest } from '../middleware/authMiddleware';

export const createShare = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tripRequest, tripResult } = req.body;

        if (!tripRequest || !tripResult) {
            res.status(400).json({ success: false, message: 'tripRequest and tripResult are required' });
            return;
        }

        const shareId = nanoid(8);

        // Optionally attach userId if authenticated
        const userId = (req as AuthRequest).userId;

        const shared = await SharedTrip.create({
            shareId,
            tripRequest,
            tripResult,
            createdBy: userId || undefined,
        });

        const shareUrl = `${req.protocol}://${req.get('host')?.replace(':3001', ':5173')}/trip/${shareId}`;

        res.status(201).json({
            success: true,
            shareId: shared.shareId,
            shareUrl,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to create share link' });
    }
};

export const getShare = async (req: Request, res: Response): Promise<void> => {
    try {
        const { shareId } = req.params;

        const shared = await SharedTrip.findOneAndUpdate(
            { shareId },
            { $inc: { viewCount: 1 } },
            { new: true }
        );

        if (!shared) {
            res.status(404).json({ success: false, message: 'Shared trip not found or has expired' });
            return;
        }

        res.json({
            success: true,
            tripRequest: shared.tripRequest,
            tripResult: shared.tripResult,
            viewCount: shared.viewCount,
            createdAt: shared.createdAt,
            expiresAt: shared.expiresAt,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to get shared trip' });
    }
};
