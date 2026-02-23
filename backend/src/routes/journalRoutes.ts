import { Router } from 'express';
import multer from 'multer';
import { createEntry, getEntriesByTrip, updateEntry, deleteEntry, getPublicJournal, uploadPhoto, getEntryCount } from '../controllers/journalController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public routes (no auth)
router.get('/trip/:tripId/public', getPublicJournal);

// Auth required routes
router.post('/', authMiddleware, createEntry);
router.get('/trip/:tripId', authMiddleware, getEntriesByTrip);
router.get('/trip/:tripId/count', authMiddleware, getEntryCount);
router.put('/:id', authMiddleware, updateEntry);
router.delete('/:id', authMiddleware, deleteEntry);
router.post('/upload-photo', authMiddleware, upload.single('photo'), uploadPhoto);

export default router;
