import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { saveTrip, getMyTrips, getTrip, updateTrip, deleteTrip } from '../controllers/savedTripController';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, getMyTrips);
router.post('/', authMiddleware, saveTrip);
router.get('/:id', authMiddleware, getTrip);
router.put('/:id', authMiddleware, updateTrip);
router.delete('/:id', authMiddleware, deleteTrip);

export default router;
