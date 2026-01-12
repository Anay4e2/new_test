import { Router } from 'express';
import { getAllRoutes, getTransportOptions, getRouteTrains, optimizeTripRoute } from '../controllers/routeController';

const router = Router();

router.get('/', getAllRoutes);
router.get('/transport', getTransportOptions);
router.get('/:fromCity/:toCity/trains', getRouteTrains);
router.post('/optimize', optimizeTripRoute);

export default router;
