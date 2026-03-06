import { Request, Response } from 'express';
import City from '../models/City';
import logger from '../lib/logger';

export const getAllCities = async (req: Request, res: Response): Promise<void> => {
    try {
        const cities = await City.find().lean();
        res.json(cities);
    } catch (error) {
        logger.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
};
