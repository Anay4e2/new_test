import { Router } from 'express';
import { createShare, getShare } from '../controllers/shareController';
import { optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes — no auth required
router.post('/', optionalAuthMiddleware, createShare);
router.get('/:shareId', optionalAuthMiddleware, getShare);

export default router;
