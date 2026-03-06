import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import FavoritePlace from '../models/FavoritePlace';
import { isDbConnected } from '../lib/dbStatus';

export const toggleFavoritePlace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { placeId, placeName, cityName } = req.body;

        if (!placeId || !placeName || !cityName) {
            res.status(400).json({ success: false, message: 'placeId, placeName, and cityName are required' });
            return;
        }

        // Check if already favorited
        const existing = await FavoritePlace.findOne({ userId: req.userId, placeId });

        if (existing) {
            await FavoritePlace.findByIdAndDelete(existing._id);
            res.json({ success: true, favorited: false, message: 'Removed from favorites' });
        } else {
            await FavoritePlace.create({
                userId: req.userId,
                placeId,
                placeName,
                cityName,
            });
            res.json({ success: true, favorited: true, message: 'Added to favorites' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to toggle favorite' });
    }
};

export const getMyFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!isDbConnected()) {
            res.json({ success: true, favorites: [] });
            return;
        }

        const favorites = await FavoritePlace.find({ userId: req.userId }).sort({ addedAt: -1 });
        res.json({ success: true, favorites });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
    }
};
