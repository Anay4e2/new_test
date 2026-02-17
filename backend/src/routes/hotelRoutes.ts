import { Router } from 'express';
import { getAllHotels, getHotelsByCity, getHotelsByTier } from '../controllers/hotelController';

const router = Router();

router.get('/', getAllHotels);
router.get('/city/:cityName', getHotelsByCity);
router.get('/city/:cityName/tier/:tier', getHotelsByTier);

export default router;
