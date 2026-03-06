import logger from '../lib/logger';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const isConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
} else {
    logger.warn('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set — photo uploads will use base64 fallback');
}

export function isCloudinaryConfigured(): boolean {
    return isConfigured;
}

export async function uploadToCloudinary(
    buffer: Buffer,
    folder: string = 'journal'
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `tripplanner/${folder}`,
                resource_type: 'image',
                transformation: [
                    { width: 1600, height: 1600, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('Upload failed'));
                } else {
                    resolve({ url: result.secure_url, publicId: result.public_id });
                }
            }
        );

        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
    });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        logger.error('Failed to delete from Cloudinary:', error);
    }
}
