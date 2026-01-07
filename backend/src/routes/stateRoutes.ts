import { Router } from 'express';
import { getAllStates } from '../controllers/stateController';

const router = Router();

router.get('/', getAllStates);

export default router;
