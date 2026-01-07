import { Router } from 'express';
import { calculateDistance, getCityDistance, getQuickDistance } from '../controllers/distanceController';

const router = Router();

router.post('/', calculateDistance);
router.get('/quick', getQuickDistance);
router.get('/:fromCity/:toCity', getCityDistance);

export default router;
