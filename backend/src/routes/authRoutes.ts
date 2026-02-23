import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, adminLogin } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes (rate-limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/admin-login', authLimiter, adminLogin);

// Protected routes
router.get('/me', authMiddleware, getMe);

export default router;
