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
import hotelRoutes from './hotelRoutes';
import restaurantRoutes from './restaurantRoutes';
import savedTripRoutes from './savedTripRoutes';
import favoritesRoutes from './favoritesRoutes';
import shareRoutes from './shareRoutes';
import weatherRoutes from './weatherRoutes';
import reviewRoutes from './reviewRoutes';
import festivalRoutes from './festivalRoutes';
import safetyRoutes from './safetyRoutes';
import expenseRoutes from './expenseRoutes';
import groupRoutes from './groupRoutes';
import feedRoutes from './feedRoutes';
import notificationRoutes from './notificationRoutes';
import journalRoutes from './journalRoutes';
import postcardRoutes from './postcardRoutes';
import currencyRoutes from './currencyRoutes';
import checklistRoutes from './checklistRoutes';
import uploadRoutes from './uploadRoutes';

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
router.use('/hotels', hotelRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/my-trips', savedTripRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/share', shareRoutes);
router.use('/weather', weatherRoutes);
router.use('/reviews', reviewRoutes);
router.use('/festivals', festivalRoutes);
router.use('/safety', safetyRoutes);
router.use('/expenses', expenseRoutes);
router.use('/groups', groupRoutes);
router.use('/feed', feedRoutes);
router.use('/notifications', notificationRoutes);
router.use('/journal', journalRoutes);
router.use('/postcards', postcardRoutes);
router.use('/currency', currencyRoutes);
router.use('/checklists', checklistRoutes);
router.use('/upload', uploadRoutes);


// Trip routes are mounted at root level (e.g., /api/generate-trip)
router.use('/', tripRoutes);

export default router;
