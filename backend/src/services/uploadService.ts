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
    logger.warn('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not set — uploads will use base64 fallback');
}

export type ResourceType = 'image' | 'video' | 'raw';

export function isCloudinaryConfigured(): boolean {
    return isConfigured;
}

/**
 * Detect Cloudinary resource_type from MIME type.
 * - image/* → 'image'
 * - video/* → 'video'
 * - application/pdf and other files → 'raw'
 */
export function detectResourceType(mimeType: string): ResourceType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
}

interface UploadOptions {
    folder?: string;
    resourceType?: ResourceType;
    /** Original filename — used for raw files so download name is preserved */
    originalFilename?: string;
}

export async function uploadToCloudinary(
    buffer: Buffer,
    options: UploadOptions | string = 'journal'
): Promise<{ url: string; publicId: string; resourceType: ResourceType }> {
    // Backwards-compat: accept a plain string as folder
    const opts: UploadOptions = typeof options === 'string' ? { folder: options } : options;
    const folder = opts.folder ?? 'general';
    const resourceType = opts.resourceType ?? 'image';

    const uploadParams: Record<string, unknown> = {
        folder: `tripplanner/${folder}`,
        resource_type: resourceType,
    };

    // Image-specific optimisations
    if (resourceType === 'image') {
        uploadParams.transformation = [
            { width: 1600, height: 1600, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
        ];
    }

    // Video-specific: limit size & auto-quality
    if (resourceType === 'video') {
        uploadParams.resource_type = 'video';
        uploadParams.transformation = [{ quality: 'auto' }];
    }

    // Raw files: preserve original filename for downloads
    if (resourceType === 'raw' && opts.originalFilename) {
        uploadParams.public_id = opts.originalFilename.replace(/\.[^/.]+$/, '');
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            uploadParams as any,
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('Upload failed'));
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        resourceType,
                    });
                }
            }
        );

        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
    });
}

export async function deleteFromCloudinary(publicId: string, resourceType: ResourceType = 'image'): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        logger.error('Failed to delete from Cloudinary:', error);
    }
}
