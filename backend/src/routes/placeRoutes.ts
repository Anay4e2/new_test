import { Router } from 'express';
import { getAllPlaces, getPlacesByState } from '../controllers/placeController';

const router = Router();

router.get('/', getAllPlaces);
router.get('/by-state/:stateCode', getPlacesByState);

export default router;
