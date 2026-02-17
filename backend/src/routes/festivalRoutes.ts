import { Router } from 'express';
import {
    getAllFestivals,
    getFestivalsByCity,
    getFestivalsByMonth,
    getFestivalsByState,
    getUpcomingFestivals,
} from '../controllers/festivalController';

const router = Router();

router.get('/', getAllFestivals);
router.get('/upcoming', getUpcomingFestivals);
router.get('/city/:cityName', getFestivalsByCity);
router.get('/month/:month', getFestivalsByMonth);
router.get('/state/:stateCode', getFestivalsByState);

export default router;
