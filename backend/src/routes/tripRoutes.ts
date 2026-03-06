import { Router, Request, Response } from 'express';
import { createTrip, optimizeRoute, compareTrips } from '../controllers/tripController';
import { parseNaturalLanguageQuery, suggestTrips } from '../services/aiSuggestionService';
import { validate } from '../middleware/validate';
import { generateTripSchema, optimizeRouteSchema } from '../lib/validationSchemas';
import logger from '../lib/logger';

const router = Router();

router.post('/generate-trip', validate(generateTripSchema), createTrip);
router.post('/generate-trip/compare', validate(generateTripSchema), compareTrips);
router.post('/trips/optimize-route', validate(optimizeRouteSchema), optimizeRoute);

// AI Suggestion routes
router.post('/suggest-trip', (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query string is required' });
        }
        const result = parseNaturalLanguageQuery(query);
        res.json(result);
    } catch (error) {
        logger.error('Error parsing trip query:', error);
        res.status(500).json({ error: 'Failed to parse query' });
    }
});

router.get('/trip-ideas', (req: Request, res: Response) => {
    try {
        const interestsParam = req.query.interests as string | undefined;
        const interests = interestsParam ? interestsParam.split(',').map(s => s.trim()) : [];
        const ideas = suggestTrips(interests);
        res.json(ideas);
    } catch (error) {
        logger.error('Error fetching trip ideas:', error);
        res.status(500).json({ error: 'Failed to fetch trip ideas' });
    }
});

export default router;
