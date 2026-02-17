import { Router } from 'express';
import { createShare, getShare } from '../controllers/shareController';

const router = Router();

// Public routes — no auth required
router.post('/', createShare);
router.get('/:shareId', getShare);

export default router;
