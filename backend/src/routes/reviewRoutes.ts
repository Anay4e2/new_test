import { Router } from 'express';
import {
    createReview,
    getReviewsForPlace,
    getMyReviews,
    markHelpful,
    deleteReview,
} from '../controllers/reviewController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public
router.get('/place/:placeId', getReviewsForPlace);

// Auth required
router.post('/', authMiddleware, createReview);
router.get('/my', authMiddleware, getMyReviews);
router.post('/:id/helpful', authMiddleware, markHelpful);
router.delete('/:id', authMiddleware, deleteReview);

export default router;
