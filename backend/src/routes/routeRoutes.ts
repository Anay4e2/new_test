import { Router } from 'express';
import { getAllRoutes, getTransportOptions, getRouteTrains } from '../controllers/routeController';

const router = Router();

router.get('/', getAllRoutes);
router.get('/transport', getTransportOptions);
router.get('/:fromCity/:toCity/trains', getRouteTrains);

export default router;
