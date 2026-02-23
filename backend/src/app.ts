import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDB from './config/db';
import routes from './routes';
import adminRoutes from './routes/adminRoutes';
import { analyticsMiddleware } from './middleware/analyticsMiddleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Analytics tracking middleware (before routes)
app.use('/api', analyticsMiddleware);

// Mount all API routes under /api
app.use('/api', routes);

// Mount admin routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — log details server-side, return generic message to client
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close().then(() => {
            console.log('Server and database connections closed.');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

