import rateLimit from 'express-rate-limit';

/**
 * Global API rate limiter — applies to all /api routes.
 * Allows 100 requests per minute per IP by default.
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please slow down.',
  },
});
