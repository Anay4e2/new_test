import { Request, Response } from 'express';
import { FESTIVALS } from '../services/mockData';

// GET /api/festivals
export const getAllFestivals = async (_req: Request, res: Response) => {
    try {
        res.json({ success: true, festivals: FESTIVALS });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch festivals' });
    }
};

// GET /api/festivals/city/:cityName
export const getFestivalsByCity = async (req: Request, res: Response) => {
    try {
        const { cityName } = req.params;
        const festivals = FESTIVALS.filter(
            (f) => f.cityName.toLowerCase() === cityName.toLowerCase() || f.cityName === 'all'
        );
        res.json({ success: true, festivals });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch festivals' });
    }
};

// GET /api/festivals/month/:month
export const getFestivalsByMonth = async (req: Request, res: Response) => {
    try {
        const month = parseInt(req.params.month, 10);
        if (isNaN(month) || month < 1 || month > 12) {
            res.status(400).json({ success: false, message: 'Invalid month (1-12)' });
            return;
        }
        const festivals = FESTIVALS.filter((f) => f.month === month);
        res.json({ success: true, festivals });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch festivals' });
    }
};

// GET /api/festivals/state/:stateCode
export const getFestivalsByState = async (req: Request, res: Response) => {
    try {
        const { stateCode } = req.params;
        const festivals = FESTIVALS.filter(
            (f) => f.stateCode.toLowerCase() === stateCode.toLowerCase()
        );
        res.json({ success: true, festivals });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch festivals' });
    }
};

// GET /api/festivals/upcoming
export const getUpcomingFestivals = async (_req: Request, res: Response) => {
    try {
        const currentMonth = new Date().getMonth() + 1; // 1-12
        const upcomingMonths = [
            currentMonth,
            currentMonth % 12 + 1,
            (currentMonth + 1) % 12 + 1,
        ];
        const festivals = FESTIVALS.filter((f) => upcomingMonths.includes(f.month));
        // Sort: current month first, then next, then after
        festivals.sort((a, b) => {
            const aIdx = upcomingMonths.indexOf(a.month);
            const bIdx = upcomingMonths.indexOf(b.month);
            return aIdx - bIdx;
        });
        res.json({ success: true, festivals });
    } catch {
        res.status(500).json({ success: false, message: 'Failed to fetch festivals' });
    }
};
