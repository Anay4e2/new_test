import { Request, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import SavedTrip from '../models/SavedTrip';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
import { isCloudinaryConfigured, uploadToCloudinary } from '../services/uploadService';

// POST /api/journal â€” create entry
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
        res.status(500).json({ success: false, message: 'Failed to create journal entry' });
    }
};

// GET /api/journal/trip/:tripId â€” get all entries for a trip (owner only)
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
        res.status(500).json({ success: false, message: 'Failed to fetch journal entries' });
    }
};

// PUT /api/journal/:id â€” update entry
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
        res.status(500).json({ success: false, message: 'Failed to update journal entry' });
    }
};

// DELETE /api/journal/:id â€” delete entry
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
        res.status(500).json({ success: false, message: 'Failed to delete journal entry' });
    }
};

// GET /api/journal/trip/:tripId/public â€” get public entries (no auth)
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
        res.status(500).json({ success: false, message: 'Failed to fetch public journal' });
    }
};

// POST /api/journal/upload-photo — accept file upload or base64 data URI
export const uploadPhoto = async (req: Request, res: Response): Promise<void> => {
    try {
        // Multer file upload (multipart/form-data)
        const file = (req as any).file as { buffer: Buffer; mimetype: string } | undefined;
        if (file) {
            if (!isCloudinaryConfigured()) {
                const base64 = file.buffer.toString('base64');
                const mimeType = file.mimetype || 'image/jpeg';
                res.json({ success: true, url: `data:${mimeType};base64,${base64}` });
                return;
            }
            const result = await uploadToCloudinary(file.buffer, 'journal');
            res.json({ success: true, url: result.url, publicId: result.publicId });
            return;
        }

        // Legacy base64 body upload
        const { photo } = req.body;
        if (!photo || typeof photo !== 'string') {
            res.status(400).json({ success: false, message: 'Photo file or data URI is required' });
            return;
        }

        if (!photo.startsWith('data:image/')) {
            res.status(400).json({ success: false, message: 'Invalid image format. Must be a data URI.' });
            return;
        }

        const sizeInBytes = photo.length * 0.75;
        const maxSize = 1.5 * 1024 * 1024;
        if (sizeInBytes > maxSize) {
            res.status(400).json({ success: false, message: 'Photo exceeds 1MB limit. Please compress before uploading.' });
            return;
        }

        if (isCloudinaryConfigured()) {
            const base64Data = photo.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            const result = await uploadToCloudinary(buffer, 'journal');
            res.json({ success: true, url: result.url, publicId: result.publicId });
            return;
        }

        res.json({ success: true, url: photo });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to upload photo' });
    }
};

// GET /api/journal/trip/:tripId/count â€” get entry count for a trip (for dashboard badge)
export const getEntryCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req as AuthRequest;
        const { tripId } = req.params;

        const count = await JournalEntry.countDocuments({ tripId, userId });

        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to get entry count' });
    }
};
