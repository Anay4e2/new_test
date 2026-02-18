import { Request, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import SavedTrip from '../models/SavedTrip';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

// POST /api/journal — create entry
export const createEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req as AuthRequest;
        const { tripId, day, city, title, content, mood, photos, placeName, isPublic } = req.body;

        if (!tripId || !day || !city || !title) {
            res.status(400).json({ success: false, message: 'tripId, day, city, and title are required' });
            return;
        }

        // Verify user owns the trip
        const trip = await SavedTrip.findOne({ _id: tripId, userId });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found or not owned by user' });
            return;
        }

        // Limit photos to 5 per entry
        const limitedPhotos = (photos || []).slice(0, 5);

        const entry = await JournalEntry.create({
            userId,
            tripId,
            day,
            city,
            title,
            content: content || '',
            mood: mood || 'happy',
            photos: limitedPhotos,
            placeName,
            isPublic: isPublic || false,
        });

        res.status(201).json({ success: true, entry });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to create journal entry' });
    }
};

// GET /api/journal/trip/:tripId — get all entries for a trip (owner only)
export const getEntriesByTrip = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req as AuthRequest;
        const { tripId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            res.status(400).json({ success: false, message: 'Invalid trip ID' });
            return;
        }

        const entries = await JournalEntry.find({ tripId, userId }).sort({ day: 1, createdAt: 1 });

        res.json({ success: true, entries, count: entries.length });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch journal entries' });
    }
};

// PUT /api/journal/:id — update entry
export const updateEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req as AuthRequest;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid entry ID' });
            return;
        }

        const entry = await JournalEntry.findOne({ _id: id, userId });
        if (!entry) {
            res.status(404).json({ success: false, message: 'Entry not found' });
            return;
        }

        const allowedFields = ['title', 'content', 'mood', 'photos', 'placeName', 'isPublic', 'day', 'city'];
        const updates: any = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = field === 'photos' ? (req.body[field] || []).slice(0, 5) : req.body[field];
            }
        }

        const updated = await JournalEntry.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        res.json({ success: true, entry: updated });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update journal entry' });
    }
};

// DELETE /api/journal/:id — delete entry
export const deleteEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req as AuthRequest;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid entry ID' });
            return;
        }

        const entry = await JournalEntry.findOneAndDelete({ _id: id, userId });
        if (!entry) {
            res.status(404).json({ success: false, message: 'Entry not found' });
            return;
        }

        res.json({ success: true, message: 'Entry deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete journal entry' });
    }
};

// GET /api/journal/trip/:tripId/public — get public entries (no auth)
export const getPublicJournal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tripId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            res.status(400).json({ success: false, message: 'Invalid trip ID' });
            return;
        }

        const entries = await JournalEntry.find({ tripId, isPublic: true }).sort({ day: 1, createdAt: 1 });

        // Get trip info for context
        const trip = await SavedTrip.findById(tripId).select('title tripRequest.duration');

        res.json({
            success: true,
            entries,
            count: entries.length,
            tripTitle: trip?.title || 'Untitled Trip',
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch public journal' });
    }
};

// POST /api/journal/upload-photo — accept base64 data URI
export const uploadPhoto = async (req: Request, res: Response): Promise<void> => {
    try {
        const { photo } = req.body;

        if (!photo || typeof photo !== 'string') {
            res.status(400).json({ success: false, message: 'Photo data URI is required' });
            return;
        }

        // Validate it's a data URI
        if (!photo.startsWith('data:image/')) {
            res.status(400).json({ success: false, message: 'Invalid image format. Must be a data URI.' });
            return;
        }

        // Check size (base64 is ~4/3 of original, so 1.4MB base64 ≈ 1MB image)
        const sizeInBytes = photo.length * 0.75;
        const maxSize = 1.5 * 1024 * 1024; // ~1MB image after base64 overhead
        if (sizeInBytes > maxSize) {
            res.status(400).json({ success: false, message: 'Photo exceeds 1MB limit. Please compress before uploading.' });
            return;
        }

        // For MVP, just return the data URI as the "URL"
        res.json({ success: true, url: photo });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to upload photo' });
    }
};

// GET /api/journal/trip/:tripId/count — get entry count for a trip (for dashboard badge)
export const getEntryCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req as AuthRequest;
        const { tripId } = req.params;

        const count = await JournalEntry.countDocuments({ tripId, userId });

        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message || 'Failed to get entry count' });
    }
};
