import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitContactQuery } from '../controllers/contactController';

const router = Router();

// Rate limit contact submissions: 5 per 15 minutes per IP
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many submissions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/', contactLimiter, submitContactQuery);

export default router;
