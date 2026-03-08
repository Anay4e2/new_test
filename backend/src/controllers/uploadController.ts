import { Request, Response } from 'express';
import logger from '../lib/logger';
import { isCloudinaryConfigured, uploadToCloudinary, detectResourceType } from '../services/uploadService';

const ALLOWED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
];

/**
 * Generic file upload for authenticated users.
 * Accepts multipart/form-data with a single "file" field.
 * Optional "folder" field to specify Cloudinary folder.
 */
export const uploadFileGeneral = async (req: Request, res: Response) => {
    try {
        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'File type not allowed. Supported: images (png/jpeg/gif/webp/svg), videos (mp4/webm/mov), PDF.',
            });
        }

        const folder = (req.body.folder as string) || 'uploads';

        if (isCloudinaryConfigured()) {
            const resourceType = detectResourceType(file.mimetype);
            const result = await uploadToCloudinary(file.buffer, {
                folder,
                resourceType,
                originalFilename: file.originalname,
            });
            return res.json({
                success: true,
                url: result.url,
                publicId: result.publicId,
                resourceType: result.resourceType,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
            });
        }

        // Fallback: convert to base64 data URL
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        res.json({
            success: true,
            url: base64,
            resourceType: file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'raw',
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        });
    } catch (error) {
        logger.error('Error in uploadFileGeneral:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
};
