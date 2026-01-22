import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import routes from './routes';
import adminRoutes from './routes/adminRoutes';
import { analyticsMiddleware } from './middleware/analyticsMiddleware';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

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

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;

