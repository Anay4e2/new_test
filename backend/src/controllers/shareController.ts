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
        res.status(500).json({ success: false, message: 'Failed to create share link' });
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

        // Build OG meta tags for social sharing
        const tripResult = shared.tripResult as any;
        const itinerary = tripResult?.itinerary || [];
        const cities = [...new Set(itinerary.map((d: any) => d.city))] as string[];
        const totalDays = itinerary.length;
        const totalCost = Math.round(tripResult?.summary?.totalCost || 0);
        const ogTitle = `${totalDays}-Day ${cities.slice(0, 3).join(', ')} Adventure`;
        const ogDescription = `${totalDays}-day trip through ${cities.join(', ')} â€” â‚¹${totalCost.toLocaleString('en-IN')} budget`;

        res.json({
            success: true,
            tripRequest: shared.tripRequest,
            tripResult: shared.tripResult,
            viewCount: shared.viewCount,
            createdAt: shared.createdAt,
            expiresAt: shared.expiresAt,
            og: {
                title: ogTitle,
                description: ogDescription,
                image: null, // Can be populated with postcard image URL in future
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to get shared trip' });
    }
};
