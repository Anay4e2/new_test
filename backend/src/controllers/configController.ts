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
            res.json({
                states: dbStates,
                packages: dbPackages,
                cities: dbCities
            });
        } else {
            console.log('DB empty, serving mock data');
            res.json({
                states: STATES,
                cities: CITIES,
                packages: PACKAGES
            });
        }
    } catch (error) {
        console.error('Error fetching config, falling back to mock:', error);
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
