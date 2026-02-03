import express from 'express';
import diamondRoutes from './diamondRoutes';

const router = express.Router();

router.use('/diamonds', diamondRoutes);

export default router;
