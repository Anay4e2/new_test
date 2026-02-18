import { Router } from 'express';
import { getPublicTrips, likeTrip, getTrendingDestinations, getUserProfile, publishTrip } from '../controllers/feedController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes (no auth required)
router.get('/', getPublicTrips);
router.get('/trending', getTrendingDestinations);
router.get('/user/:userId', getUserProfile);

// Auth required
router.post('/:tripId/like', authMiddleware, likeTrip);
router.put('/:tripId/publish', authMiddleware, publishTrip);

export default router;
