import { Router } from 'express';
import { getConfig, getHealthStatus } from '../controllers/configController';

const router = Router();

router.get('/', getConfig);
router.get('/health', getHealthStatus);

export default router;
