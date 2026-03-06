import { Router } from 'express';
import { getAllPlaces, getPlacesByState, getPlacePhotos } from '../controllers/placeController';

const router = Router();

router.get('/', getAllPlaces);
router.get('/by-state/:stateCode', getPlacesByState);
router.get('/:placeName/photos', getPlacePhotos);

export default router;
