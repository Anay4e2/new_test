import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadFileGeneral } from '../controllers/uploadController';

const router = Router();

// 50MB limit for video support; MIME validation in controller
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

// Authenticated users can upload files
router.post('/', authMiddleware, upload.single('file'), uploadFileGeneral);

export default router;
