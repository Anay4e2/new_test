import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import connectDB from './config/db';
import routes from './routes';
import adminRoutes from './routes/adminRoutes';
import { analyticsMiddleware } from './middleware/analyticsMiddleware';
import { globalLimiter } from './middleware/rateLimiter';
import { initSocketIO } from './socket';
import logger from './lib/logger';
import { AppError, ValidationError as AppValidationError } from './lib/errors';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Initialize Socket.IO
initSocketIO(httpServer);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Global rate limiter — 100 req/min per IP on all /api routes
app.use('/api', globalLimiter);

// Analytics tracking middleware (before routes)
app.use('/api', analyticsMiddleware);

// Mount all API routes under /api
app.use('/api', routes);

// Mount admin routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// Global error handler — structured logging & consistent response shape
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    // Operational errors we raised intentionally
    if (err instanceof AppError) {
        if (err instanceof AppValidationError) {
            res.status(err.status).json({
                success: false,
                code: err.code,
                message: err.message,
                errors: err.details,
            });
            return;
        }
        logger.warn(err.message, { code: err.code, status: err.status });
        res.status(err.status).json({
            success: false,
            code: err.code,
            message: err.message,
        });
        return;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError' && err.errors) {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        logger.warn('Mongoose validation error', { messages });
        res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: messages.join(', '),
        });
        return;
    }

    // Unexpected / programming errors
    logger.error('Unhandled error', err);
    res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
    });
});

// Start server
const server = httpServer.listen(PORT, () => {
    logger.info(`Backend server running on http://localhost:${PORT}`);
});

const shutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close().then(() => {
            logger.info('Server and database connections closed.');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

