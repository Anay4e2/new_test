import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, adminLogin, forgotPassword, resetPassword, updateProfile, changePassword, verifyOtp, resendOtp } from '../controllers/authController';
import { googleAuth } from '../controllers/oauthController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema, changePasswordSchema, verifyOtpSchema, resendOtpSchema } from '../lib/validationSchemas';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Too many attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes (rate-limited + validated)
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), resendOtp);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin-login', authLimiter, validate(loginSchema), adminLogin);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/google', authLimiter, googleAuth);

// Protected routes (validated)
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);

export default router;
