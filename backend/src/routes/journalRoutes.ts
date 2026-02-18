import { Router } from 'express';
import { createEntry, getEntriesByTrip, updateEntry, deleteEntry, getPublicJournal, uploadPhoto, getEntryCount } from '../controllers/journalController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no auth)
router.get('/trip/:tripId/public', getPublicJournal);

// Auth required routes
router.post('/', authMiddleware, createEntry);
router.get('/trip/:tripId', authMiddleware, getEntriesByTrip);
router.get('/trip/:tripId/count', authMiddleware, getEntryCount);
router.put('/:id', authMiddleware, updateEntry);
router.delete('/:id', authMiddleware, deleteEntry);
router.post('/upload-photo', authMiddleware, uploadPhoto);

export default router;
