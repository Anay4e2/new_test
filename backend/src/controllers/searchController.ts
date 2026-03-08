import { Request, Response } from 'express';
import City from '../models/City';
import Place from '../models/Place';
import Package from '../models/Package';
import logger from '../lib/logger';

// GET /api/search?q=<query>&limit=10
export const globalSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const q = (req.query.q as string || '').trim();
        if (!q || q.length < 2) {
            res.json({ success: true, results: { cities: [], places: [], packages: [] } });
            return;
        }

        const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const [cities, places, packages] = await Promise.all([
            City.find({ $or: [{ name: regex }, { state: regex }] })
                .select('name state description image coordinates')
                .limit(limit)
                .lean(),
            Place.find({ $or: [{ name: regex }, { cityName: regex }, { type: regex }] })
                .select('name cityName type rating imageUrl description')
                .limit(limit)
                .lean(),
            Package.find({ $or: [{ name: regex }, { description: regex }, { cities: regex }], isActive: true })
                .select('name description cities duration budget imageUrl')
                .limit(limit)
                .lean(),
        ]);

        res.json({ success: true, results: { cities, places, packages } });
    } catch (error) {
        logger.error('Global search error:', error);
        res.status(500).json({ success: false, message: 'Search failed' });
    }
};
