import express from 'express';
import { registerAdmin, loginAdmin, getMe } from '../controllers/AdminController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/me', protect, getMe);

export default router;
