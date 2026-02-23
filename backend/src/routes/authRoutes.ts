import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, adminLogin, forgotPassword, resetPassword, updateProfile, changePassword } from '../controllers/authController';
import { googleAuth } from '../controllers/oauthController';
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
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/google', authLimiter, googleAuth);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, changePassword);

export default router;
