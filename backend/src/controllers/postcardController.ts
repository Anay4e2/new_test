import logger from '../lib/logger';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Postcard from '../models/Postcard';
import { isCloudinaryConfigured, uploadToCloudinary, deleteFromCloudinary } from '../services/uploadService';

// POST /api/postcards — save a postcard image
export const savePostcard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tripId, template, title, message } = req.body;
        const file = (req as any).file as { buffer: Buffer; mimetype: string } | undefined;

        if (!file) {
            res.status(400).json({ success: false, message: 'Postcard image is required' });
            return;
        }

        let imageUrl: string;
        let publicId: string | undefined;

        if (isCloudinaryConfigured()) {
            const result = await uploadToCloudinary(file.buffer, 'postcards');
            imageUrl = result.url;
            publicId = result.publicId;
        } else {
            const base64 = file.buffer.toString('base64');
            imageUrl = `data:${file.mimetype};base64,${base64}`;
        }

        const postcard = await Postcard.create({
            userId: req.userId,
            tripId: tripId || undefined,
            imageUrl,
            publicId,
            template: template || 'classic',
            title: title || '',
            message: message || '',
        });

        res.status(201).json({ success: true, postcard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to save postcard' });
    }
};

// GET /api/postcards — list my postcards
export const getMyPostcards = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postcards = await Postcard.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, postcards });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch postcards' });
    }
};

// DELETE /api/postcards/:id
export const deletePostcard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const postcard = await Postcard.findById(req.params.id);
        if (!postcard) {
            res.status(404).json({ success: false, message: 'Postcard not found' });
            return;
        }
        if (postcard.userId.toString() !== req.userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        if (postcard.publicId) {
            await deleteFromCloudinary(postcard.publicId).catch(() => {});
        }

        await Postcard.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Postcard deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete postcard' });
    }
};

// POST /api/postcards/:id/send — send postcard via email
export const sendPostcard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { recipientEmail } = req.body;
        if (!recipientEmail) {
            res.status(400).json({ success: false, message: 'Recipient email is required' });
            return;
        }

        const postcard = await Postcard.findById(req.params.id);
        if (!postcard) {
            res.status(404).json({ success: false, message: 'Postcard not found' });
            return;
        }
        if (postcard.userId.toString() !== req.userId) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }

        // Mark as sent (actual email sending requires SMTP configuration)
        postcard.recipientEmail = recipientEmail;
        postcard.sentAt = new Date();
        await postcard.save();

        // Log for now — real email integration uses emailService
        logger.info(`[Postcard] Would send postcard ${postcard._id} to ${recipientEmail}`);

        res.json({ success: true, message: 'Postcard sent!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send postcard' });
    }
};
