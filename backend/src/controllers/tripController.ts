import { Request, Response } from 'express';
import { generateTrip, TripRequest, TripResult } from '../services/planner';
import { optimizeRoute as optimizeRouteService } from '../services/routeOptimizer';
import logger from '../lib/logger';
import crypto from 'crypto';

// Simple in-memory cache for trip generation results
const tripCache = new Map<string, { result: TripResult; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 50;

function getTripCacheKey(req: TripRequest): string {
    const normalized = {
        cities: [...req.selectedCityIds].sort(),
        duration: req.duration,
        budget: req.budget,
        style: req.travelStyle,
        constraints: req.constraints,
    };
    return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

function getCachedTrip(key: string): TripResult | null {
    const entry = tripCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        tripCache.delete(key);
        return null;
    }
    return entry.result;
}

function setCachedTrip(key: string, result: TripResult): void {
    // Evict oldest if at capacity
    if (tripCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = tripCache.keys().next().value;
        if (oldestKey) tripCache.delete(oldestKey);
    }
    tripCache.set(key, { result, timestamp: Date.now() });
}

export const createTrip = async (req: Request, res: Response): Promise<void> => {
    try {
        const tripRequest: TripRequest = req.body;

        // Validate request
        if (!tripRequest.selectedCityIds || tripRequest.selectedCityIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one city' });
            return;
        }

        const duration = Number(tripRequest.duration);
        if (!duration || duration < 1 || duration > 30) {
            res.status(400).json({ error: 'Duration must be between 1 and 30 days' });
            return;
        }

        if (!['budget', 'standard', 'premium'].includes(tripRequest.budget)) {
            res.status(400).json({ error: 'Invalid budget tier' });
            return;
        }

        if (!['relaxed', 'fast'].includes(tripRequest.travelStyle)) {
            res.status(400).json({ error: 'Invalid travel style' });
            return;
        }

        // Now planner needs to be async or handle fetching data internally
        const cacheKey = getTripCacheKey(tripRequest);
        const cached = getCachedTrip(cacheKey);
        if (cached) {
            res.json(cached);
            return;
        }

        const result = await generateTrip(tripRequest);
        setCachedTrip(cacheKey, result);
        res.json(result);
    } catch (error: any) {
        logger.error('Error generating trip:', error);
        res.status(500).json({ error: 'Internal server error' });
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
        logger.error('Error optimizing route:', error);
        res.status(500).json({ error: 'Failed to optimize route' });
    }
};

export const compareTrips = async (req: Request, res: Response): Promise<void> => {
    try {
        const baseRequest: TripRequest = req.body;

        if (!baseRequest.selectedCityIds || baseRequest.selectedCityIds.length === 0) {
            res.status(400).json({ error: 'Please select at least one city' });
            return;
        }

        // Generate 3 variants in parallel
        const [relaxed, balanced, fast] = await Promise.all([
            generateTrip({
                ...baseRequest,
                travelStyle: 'relaxed',
                constraints: { ...baseRequest.constraints, maxTravelHoursPerDay: 4 },
            }),
            generateTrip(baseRequest), // original as-is
            generateTrip({
                ...baseRequest,
                travelStyle: 'fast',
                constraints: { ...baseRequest.constraints, maxTravelHoursPerDay: 8 },
            }),
        ]);

        res.json({
            variants: [
                { label: 'Relaxed', tripResult: relaxed },
                { label: 'Balanced', tripResult: balanced },
                { label: 'Fast-Paced', tripResult: fast },
            ],
        });
    } catch (error: any) {
        logger.error('Error comparing trips:', error);
        res.status(500).json({ error: 'Failed to compare trips' });
    }
};
