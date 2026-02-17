import { Router } from 'express';
import { createTrip, optimizeRoute, compareTrips } from '../controllers/tripController';

const router = Router();

router.post('/generate-trip', createTrip);
router.post('/generate-trip/compare', compareTrips);
router.post('/trips/optimize-route', optimizeRoute);

export default router;
