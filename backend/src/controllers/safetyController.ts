import { Request, Response } from 'express';
import { EMERGENCY_INFO } from '../services/mockData';

// GET /api/safety
export const getAllSafetyInfo = async (_req: Request, res: Response) => {
    try {
        res.json({ success: true, data: EMERGENCY_INFO });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch safety info' });
    }
};

// GET /api/safety/:cityName
export const getSafetyInfo = async (req: Request, res: Response) => {
    try {
        const { cityName } = req.params;
        // Case-insensitive lookup
        const key = Object.keys(EMERGENCY_INFO).find(
            k => k.toLowerCase() === cityName.toLowerCase()
        );
        if (!key) {
            res.status(404).json({ success: false, message: `No safety info found for ${cityName}` });
            return;
        }
        res.json({ success: true, data: EMERGENCY_INFO[key] });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch safety info' });
    }
};
