import { Request, Response } from 'express';
import Route from '../models/Route';
import { getTransportOptions as getTransportOptionsService, optimizeRoute as optimizeRouteService } from '../services/routeOptimizer';
import trainService from '../services/trainService';

export const getAllRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
        const routes = await Route.find();
        res.json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
};

export const getTransportOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            res.status(400).json({ error: 'Please provide both from and to city names' });
            return;
        }

        const result = await getTransportOptionsService(from as string, to as string);
        if (!result) {
            res.status(404).json({ error: 'No route found between these cities' });
            return;
        }

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching transport options:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch transport options' });
    }
};

export const getRouteTrains = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fromCity, toCity } = req.params;
        const { date } = req.query;

        // Get route info from database
        const route = await Route.findOne({
            $or: [
                { fromCity, toCity },
                { fromCity: toCity, toCity: fromCity }
            ]
        });

        // Get live train data from RapidAPI
        const trainData = await trainService.getTrainsBetweenStations(
            fromCity,
            toCity,
            date as string | undefined
        );

        res.json({
            route: route || null,
            fromStation: trainData.fromStation,
            toStation: trainData.toStation,
            fromCode: trainData.fromCode,
            toCode: trainData.toCode,
            trains: trainData.trains,
            totalTrains: trainData.totalTrains,
            lastUpdated: trainData.lastUpdated,
            source: trainData.source,
        });
    } catch (error: any) {
        console.error('Error fetching route trains:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch train information' });
    }
};

export const optimizeTripRoute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { placeIds = [], places = [], startCityName } = req.body;

        const hasPlaceIds = Array.isArray(placeIds) && placeIds.length > 0;
        const hasPlaces = Array.isArray(places) && places.length > 0;

        if (!hasPlaceIds && !hasPlaces) {
            res.status(400).json({ error: 'Please provide place IDs or places data' });
            return;
        }

        const result = await optimizeRouteService({ placeIds, places, startCityName });
        res.json(result);
    } catch (error: any) {
        console.error('Error optimizing route:', error);
        res.status(500).json({ error: error.message || 'Failed to optimize route' });
    }
};
