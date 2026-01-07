import { Request, Response } from 'express';
import State from '../models/State';

export const getAllStates = async (req: Request, res: Response): Promise<void> => {
    try {
        const states = await State.find();
        res.json(states);
    } catch (error) {
        console.error('Error fetching states:', error);
        res.status(500).json({ error: 'Failed to fetch states' });
    }
};
