import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { toggleFavoritePlace, getMyFavorites } from '../controllers/favoritesController';

const router = Router();

router.get('/', authMiddleware, getMyFavorites);
router.post('/toggle', authMiddleware, toggleFavoritePlace);

export default router;
