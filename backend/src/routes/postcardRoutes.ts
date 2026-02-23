import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware';
import { savePostcard, getMyPostcards, deletePostcard, sendPostcard } from '../controllers/postcardController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', authMiddleware, getMyPostcards);
router.post('/', authMiddleware, upload.single('image'), savePostcard);
router.delete('/:id', authMiddleware, deletePostcard);
router.post('/:id/send', authMiddleware, sendPostcard);

export default router;
