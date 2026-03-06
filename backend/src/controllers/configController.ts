import logger from '../lib/logger';
import { Request, Response } from 'express';
import State from '../models/State';
import Package from '../models/Package';
import City from '../models/City';
import { STATES, CITIES, PACKAGES } from '../services/mockData';
import { getIntegrationStatus } from '../config/integrations';

export const getConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        // Try to fetch from DB
        const dbStates = await State.find();
        const dbPackages = await Package.find();
        const dbCities = await City.find();

        if (dbStates.length > 0) {
            // Build lookup maps from mock data for image fallbacks (keyed by name for cross-format compatibility)
            const mockStateImages = new Map(STATES.map(s => [s.name, s.imageUrl]));
            const mockCityImages = new Map(CITIES.map(c => [c.name, c.imageUrl]));

            // Fix state images: prefer mock data Unsplash URLs over broken DB paths
            const fixedStates = dbStates.map(s => {
                const state = s.toObject ? s.toObject() : s;
                const mockUrl = mockStateImages.get(state.name);
                if (mockUrl) {
                    state.imageUrl = mockUrl;
                } else if (!state.imageUrl || state.imageUrl.startsWith('/images/')) {
                    state.imageUrl = `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=800&fit=crop`;
                }
                return state;
            });

            // Fix city images: prefer mock data Unsplash URLs over broken DB URLs
            const fixedCities = dbCities.map(c => {
                const city = c.toObject ? c.toObject() : c;
                const mockUrl = mockCityImages.get(city.name);
                if (mockUrl) {
                    city.imageUrl = mockUrl;
                } else if (!city.imageUrl) {
                    city.imageUrl = `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=400&fit=crop`;
                }
                return city;
            });

            res.json({
                states: fixedStates,
                packages: dbPackages.length > 0 ? dbPackages : PACKAGES,
                cities: fixedCities.length > 0 ? fixedCities : CITIES
            });
        } else {
            logger.info('DB empty, serving mock data');
            res.json({
                states: STATES,
                cities: CITIES,
                packages: PACKAGES
            });
        }
    } catch (error) {
        logger.error('Error fetching config, falling back to mock:', error);
        res.json({
            states: STATES,
            cities: CITIES,
            packages: PACKAGES
        });
    }
};

export const getHealthStatus = async (_req: Request, res: Response): Promise<void> => {
    const integrations = getIntegrationStatus();
    res.json({
        status: 'ok',
        version: '1.0.0',
        uptime: process.uptime(),
        integrations,
    });
};
