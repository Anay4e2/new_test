import { Router } from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware';
import {
    getSummary,
    getTraffic,
    getSearches,
    getRecentActivity
} from '../controllers/analyticsController';
import {
    getAllPlacesAdmin,
    createPlace,
    updatePlace,
    deletePlace,
    getAllTripsAdmin,
    deleteTripAdmin
} from '../controllers/adminController';

const router = Router();

// All routes require admin authentication
router.use(adminMiddleware);

// Analytics endpoints
router.get('/analytics/summary', getSummary);
router.get('/analytics/traffic', getTraffic);
router.get('/analytics/searches', getSearches);
router.get('/analytics/recent', getRecentActivity);

// Places Management
router.get('/places', getAllPlacesAdmin);
router.post('/places', createPlace);
router.put('/places/:id', updatePlace);
router.delete('/places/:id', deletePlace);

// Trips Management
router.get('/trips', getAllTripsAdmin);
router.delete('/trips/:id', deleteTripAdmin);

export default router;
