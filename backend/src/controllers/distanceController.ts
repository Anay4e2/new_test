import { Request, Response } from 'express';
import City from '../models/City';
import distanceService, { haversineDistance } from '../services/distanceService';

export const calculateDistance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { from, to, useApi = true } = req.body;

        if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
            res.status(400).json({ error: 'Required: from.lat, from.lng, to.lat, to.lng' });
            return;
        }

        const result = await distanceService.getDistance(
            { lat: from.lat, lng: from.lng },
            { lat: to.lat, lng: to.lng },
            useApi
        );

        res.json(result);
    } catch (error) {
        console.error('Error calculating distance:', error);
        res.status(500).json({ error: 'Failed to calculate distance' });
    }
};

export const getCityDistance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromCity, toCity } = req.params;
        const useApi = req.query.useApi !== 'false';

        // Get city coordinates from database
        const cities = await City.find({ name: { $in: [fromCity, toCity] } });

        if (cities.length < 2) {
            res.status(404).json({ error: 'One or both cities not found' });
            return;
        }

        const from = cities.find(c => c.name === fromCity)!;
        const to = cities.find(c => c.name === toCity)!;

        const result = await distanceService.getDistance(
            from.coordinates,
            to.coordinates,
            useApi
        );

        res.json({
            fromCity: fromCity,
            toCity: toCity,
            ...result,
            drivingTime: distanceService.getDrivingTime(result.distanceUsed),
        });
    } catch (error) {
        console.error('Error calculating city distance:', error);
        res.status(500).json({ error: 'Failed to calculate distance' });
    }
};

export const getQuickDistance = (req: Request, res: Response): void => {
    try {
        const { lat1, lon1, lat2, lon2 } = req.query;

        if (!lat1 || !lon1 || !lat2 || !lon2) {
            res.status(400).json({ error: 'Required: lat1, lon1, lat2, lon2' });
            return;
        }

        const straightLine = haversineDistance(
            parseFloat(lat1 as string),
            parseFloat(lon1 as string),
            parseFloat(lat2 as string),
            parseFloat(lon2 as string)
        );

        const roadEstimate = Math.round(straightLine * 1.3);

        res.json({
            straightLineDistance: Math.round(straightLine * 10) / 10,
            roadEstimate: roadEstimate,
            unit: 'km',
            drivingTimeHours: distanceService.getDrivingTime(roadEstimate),
        });
    } catch (error) {
        console.error('Error calculating quick distance:', error);
        res.status(500).json({ error: 'Failed to calculate distance' });
    }
};
