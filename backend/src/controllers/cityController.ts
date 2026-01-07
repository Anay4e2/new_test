import { Request, Response } from 'express';
import City from '../models/City';

export const getAllCities = async (req: Request, res: Response): Promise<void> => {
    try {
        const cities = await City.find();
        res.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
};
