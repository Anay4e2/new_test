import { Request, Response } from 'express';
import { generateTrip, TripRequest } from '../services/planner';
import { optimizeRoute as optimizeRouteService } from '../services/routeOptimizer';

export const createTrip = async (req: Request, res: Response): Promise<void> => {
    try {
        const tripRequest: TripRequest = req.body;

        // Validate request
        if (!tripRequest.selectedCityIds || tripRequest.selectedCityIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one city' });
            return;
        }

        // Now planner needs to be async or handle fetching data internally
        const result = await generateTrip(tripRequest);
        res.json(result);
    } catch (error: any) {
        console.error('Error generating trip:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const optimizeRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { placeIds, startCityName } = req.body;

        if (!placeIds || placeIds.length === 0) {
            res.status(400).json({ error: 'Please provide at least one place' });
            return;
        }

        const result = await optimizeRouteService({ placeIds, startCityName });
        res.json(result);
    } catch (error: any) {
        console.error('Error optimizing route:', error);
        res.status(500).json({ error: error.message || 'Failed to optimize route' });
    }
};
