import logger from '../lib/logger';
import { Router, Request, Response } from 'express';
import { getSeasonalWeather, getWeatherForecast, getCityCoordinates } from '../services/weatherService';

const router = Router();

// GET /api/weather/forecast/:cityName?date=YYYY-MM-DD
router.get('/forecast/:cityName', async (req: Request, res: Response) => {
    try {
        const { cityName } = req.params;
        const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

        const coords = getCityCoordinates(cityName);
        if (!coords) {
            // Still return seasonal data with default coords
            const month = new Date(date).getMonth() + 1;
            const weather = getSeasonalWeather(cityName, month);
            res.json({ success: true, data: weather });
            return;
        }

        const weather = await getWeatherForecast(coords.lat, coords.lng, date, cityName);
        res.json({ success: true, data: weather });
    } catch (error) {
        logger.error('Weather forecast error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch weather forecast' });
    }
});

// GET /api/weather/seasonal/:cityName/:month
router.get('/seasonal/:cityName/:month', (req: Request, res: Response) => {
    try {
        const { cityName } = req.params;
        const month = parseInt(req.params.month, 10);

        if (isNaN(month) || month < 1 || month > 12) {
            res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
            return;
        }

        const weather = getSeasonalWeather(cityName, month);
        res.json({ success: true, data: weather });
    } catch (error) {
        logger.error('Seasonal weather error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch seasonal weather' });
    }
});

export default router;
