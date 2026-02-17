import { Router } from 'express';
import { getAllRestaurants, getRestaurantsByCity, getRestaurantsByType } from '../controllers/restaurantController';

const router = Router();

router.get('/', getAllRestaurants);
router.get('/city/:cityName', getRestaurantsByCity);
router.get('/city/:cityName/type/:type', getRestaurantsByType);

export default router;
