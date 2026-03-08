import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';

const router = Router();

// GET /api/search?q=<query>
router.get('/', globalSearch);

export default router;
