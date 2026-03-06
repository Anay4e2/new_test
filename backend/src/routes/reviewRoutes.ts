import { Router } from 'express';
import {
    createReview,
    getReviewsForPlace,
    getMyReviews,
    markHelpful,
    updateReview,
    deleteReview,
} from '../controllers/reviewController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate, validateParams } from '../middleware/validate';
import { createReviewSchema, objectIdParam } from '../lib/validationSchemas';

const router = Router();

// Public
router.get('/place/:placeId', getReviewsForPlace);

// Auth required
router.post('/', authMiddleware, validate(createReviewSchema), createReview);
router.get('/my', authMiddleware, getMyReviews);
router.post('/:id/helpful', authMiddleware, validateParams(objectIdParam), markHelpful);
router.put('/:id', authMiddleware, validateParams(objectIdParam), updateReview);
router.delete('/:id', authMiddleware, validateParams(objectIdParam), deleteReview);

export default router;
