import { Router } from 'express';
import { register, login, getMe, adminLogin } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminLogin);

// Protected routes
router.get('/me', authMiddleware, getMe);

export default router;
