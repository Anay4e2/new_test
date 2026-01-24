import { Router } from 'express';
import configRoutes from './configRoutes';
import placeRoutes from './placeRoutes';
import cityRoutes from './cityRoutes';
import stateRoutes from './stateRoutes';
import routeRoutes from './routeRoutes';
import trainRoutes from './trainRoutes';
import distanceRoutes from './distanceRoutes';
import tripRoutes from './tripRoutes';
import itineraryRoutes from './itineraryRoutes';
import authRoutes from './authRoutes';
import packageRoutes from './packageRoutes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/config', configRoutes);
router.use('/places', placeRoutes);
router.use('/cities', cityRoutes);
router.use('/states', stateRoutes);
router.use('/routes', routeRoutes);
router.use('/trains', trainRoutes);
router.use('/distance', distanceRoutes);
router.use('/itinerary', itineraryRoutes);
router.use('/packages', packageRoutes);

// Trip routes are mounted at root level (e.g., /api/generate-trip)
router.use('/', tripRoutes);

export default router;
