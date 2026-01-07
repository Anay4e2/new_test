import { Router } from 'express';
import { createTrip, optimizeRoute } from '../controllers/tripController';

const router = Router();

router.post('/generate-trip', createTrip);
router.post('/trips/optimize-route', optimizeRoute);

export default router;
