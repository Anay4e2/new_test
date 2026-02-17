import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import SavedTrip from '../models/SavedTrip';

export const saveTrip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, tripRequest, tripResult } = req.body;

        if (!title || !tripRequest || !tripResult) {
            res.status(400).json({ success: false, message: 'Title, tripRequest, and tripResult are required' });
            return;
        }

        const savedTrip = await SavedTrip.create({
            userId: req.userId,
            title,
            tripRequest,
            tripResult,
        });

        res.status(201).json({ success: true, trip: savedTrip });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to save trip' });
    }
};

export const getMyTrips = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const trips = await SavedTrip.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .select('title isFavorite notes createdAt updatedAt tripResult.summary tripResult.itinerary');

        res.json({ success: true, trips });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch trips' });
    }
};

export const getTrip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const trip = await SavedTrip.findById(req.params.id);

        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        if (trip.userId.toString() !== req.userId) {
            res.status(403).json({ success: false, message: 'Not authorized to view this trip' });
            return;
        }

        res.json({ success: true, trip });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch trip' });
    }
};

export const updateTrip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const trip = await SavedTrip.findById(req.params.id);

        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        if (trip.userId.toString() !== req.userId) {
            res.status(403).json({ success: false, message: 'Not authorized to update this trip' });
            return;
        }

        const { title, notes, isFavorite } = req.body;
        if (title !== undefined) trip.title = title;
        if (notes !== undefined) trip.notes = notes;
        if (isFavorite !== undefined) trip.isFavorite = isFavorite;

        await trip.save();
        res.json({ success: true, trip });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update trip' });
    }
};

export const deleteTrip = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const trip = await SavedTrip.findById(req.params.id);

        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        if (trip.userId.toString() !== req.userId) {
            res.status(403).json({ success: false, message: 'Not authorized to delete this trip' });
            return;
        }

        await SavedTrip.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Trip deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete trip' });
    }
};
