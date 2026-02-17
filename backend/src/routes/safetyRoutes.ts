import { Router } from 'express';
import { getAllSafetyInfo, getSafetyInfo } from '../controllers/safetyController';

const router = Router();

router.get('/', getAllSafetyInfo);
router.get('/:cityName', getSafetyInfo);

export default router;
