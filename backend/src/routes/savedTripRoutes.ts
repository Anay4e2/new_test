import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { saveTrip, getMyTrips, getTrip, updateTrip, deleteTrip, cloneTrip } from '../controllers/savedTripController';
import { validate, validateParams } from '../middleware/validate';
import { saveTripSchema, updateTripSchema, objectIdParam } from '../lib/validationSchemas';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, getMyTrips);
router.post('/', authMiddleware, validate(saveTripSchema), saveTrip);
router.get('/:id', authMiddleware, validateParams(objectIdParam), getTrip);
router.put('/:id', authMiddleware, validateParams(objectIdParam), validate(updateTripSchema), updateTrip);
router.delete('/:id', authMiddleware, validateParams(objectIdParam), deleteTrip);
router.post('/:id/clone', authMiddleware, validateParams(objectIdParam), cloneTrip);

export default router;
