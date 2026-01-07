import { Request, Response } from 'express';
import Place from '../models/Place';
import City from '../models/City';
import { PLACES } from '../services/mockData';

export const getAllPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
        let places = await Place.find();

        // If no places in DB, use mock data
        if (!places || places.length === 0) {
            console.log('No places in DB, using mock data');
            res.json(PLACES);
            return;
        }

        res.json(places);
    } catch (error) {
        console.error('Error fetching places, using mock data:', error);
        res.json(PLACES);
    }
};

export const getPlacesByState = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stateCode } = req.params;

        // Get cities in this state
        const cities = await City.find({ stateCode });
        const cityNames = cities.map(c => c.name);

        // Get places in those cities
        const places = await Place.find({ cityName: { $in: cityNames } });
        res.json(places);
    } catch (error: any) {
        console.error('Error fetching places by state:', error);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
};
