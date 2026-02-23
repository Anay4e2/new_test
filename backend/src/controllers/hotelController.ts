import { Request, Response } from 'express';
import Hotel from '../models/Hotel';
import { HOTELS as MOCK_HOTELS } from '../services/mockData';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface MockHotel {
    _id: string;
    name: string;
    cityName: string;
    stateCode: string;
    coordinates: { lat: number; lng: number };
    tier: 'budget' | 'standard' | 'premium';
    pricePerNight: number;
    rating: number;
    amenities: string[];
    imageUrl?: string;
    contactPhone?: string;
    bookingUrl?: string;
    description: string;
}

export const getAllHotels = async (req: Request, res: Response): Promise<void> => {
    try {
        const hotels = await Hotel.find();
        if (hotels.length > 0) {
            res.json(hotels);
            return;
        }
        // Fallback to mock data
        res.json(MOCK_HOTELS);
    } catch (error) {
        // Fallback to mock data on DB error
        res.json(MOCK_HOTELS);
    }
};

export const getHotelsByCity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cityName } = req.params;
        const decodedCity = decodeURIComponent(cityName);

        const hotels = await Hotel.find({ cityName: new RegExp(`^${escapeRegex(decodedCity)}$`, 'i') });
        if (hotels.length > 0) {
            res.json(hotels);
            return;
        }
        // Fallback to mock data
        const mockResults = MOCK_HOTELS.filter(
            h => h.cityName.toLowerCase() === decodedCity.toLowerCase()
        );
        res.json(mockResults);
    } catch (error) {
        const { cityName } = req.params;
        const decodedCity = decodeURIComponent(cityName);
        const mockResults = MOCK_HOTELS.filter(
            h => h.cityName.toLowerCase() === decodedCity.toLowerCase()
        );
        res.json(mockResults);
    }
};

export const getHotelsByTier = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cityName, tier } = req.params;
        const decodedCity = decodeURIComponent(cityName);

        const hotels = await Hotel.find({
            cityName: new RegExp(`^${escapeRegex(decodedCity)}$`, 'i'),
            tier
        });
        if (hotels.length > 0) {
            res.json(hotels);
            return;
        }
        // Fallback to mock data
        const mockResults = MOCK_HOTELS.filter(
            h => h.cityName.toLowerCase() === decodedCity.toLowerCase() && h.tier === tier
        );
        res.json(mockResults);
    } catch (error) {
        const { cityName, tier } = req.params;
        const decodedCity = decodeURIComponent(cityName);
        const mockResults = MOCK_HOTELS.filter(
            h => h.cityName.toLowerCase() === decodedCity.toLowerCase() && h.tier === tier
        );
        res.json(mockResults);
    }
};
