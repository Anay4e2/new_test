import { Router } from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware';
import {
    getSummary,
    getTraffic,
    getSearches,
    getRecentActivity
} from '../controllers/analyticsController';

const router = Router();

// All routes require admin authentication
router.use(adminMiddleware);

// Analytics endpoints
router.get('/analytics/summary', getSummary);
router.get('/analytics/traffic', getTraffic);
router.get('/analytics/searches', getSearches);
router.get('/analytics/recent', getRecentActivity);

export default router;
