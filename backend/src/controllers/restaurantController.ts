import { Request, Response } from 'express';
import Restaurant from '../models/Restaurant';
import { RESTAURANTS as MOCK_RESTAURANTS } from '../services/mockData';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface MockRestaurant {
    _id: string;
    name: string;
    cityName: string;
    cuisine: string[];
    type: 'street-food' | 'casual' | 'fine-dining' | 'dhaba' | 'cafe';
    priceRange: 'budget' | 'moderate' | 'expensive';
    averageCost: number;
    rating: number;
    mustTry: string[];
    coordinates: { lat: number; lng: number };
    openingTime: string;
    closingTime: string;
    vegetarian: boolean;
    description: string;
}

export const getAllRestaurants = async (req: Request, res: Response): Promise<void> => {
    try {
        const restaurants = await Restaurant.find();
        if (restaurants.length > 0) {
            res.json(restaurants);
            return;
        }
        res.json(MOCK_RESTAURANTS);
    } catch (error) {
        res.json(MOCK_RESTAURANTS);
    }
};

export const getRestaurantsByCity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cityName } = req.params;
        const decodedCity = decodeURIComponent(cityName);

        const restaurants = await Restaurant.find({ cityName: new RegExp(`^${escapeRegex(decodedCity)}$`, 'i') });
        if (restaurants.length > 0) {
            res.json(restaurants);
            return;
        }
        const mockResults = MOCK_RESTAURANTS.filter(
            (r: MockRestaurant) => r.cityName.toLowerCase() === decodedCity.toLowerCase()
        );
        res.json(mockResults);
    } catch (error) {
        const { cityName } = req.params;
        const decodedCity = decodeURIComponent(cityName);
        const mockResults = MOCK_RESTAURANTS.filter(
            (r: MockRestaurant) => r.cityName.toLowerCase() === decodedCity.toLowerCase()
        );
        res.json(mockResults);
    }
};

export const getRestaurantsByType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cityName, type } = req.params;
        const decodedCity = decodeURIComponent(cityName);

        const restaurants = await Restaurant.find({
            cityName: new RegExp(`^${escapeRegex(decodedCity)}$`, 'i'),
            type
        });
        if (restaurants.length > 0) {
            res.json(restaurants);
            return;
        }
        const mockResults = MOCK_RESTAURANTS.filter(
            (r: MockRestaurant) => r.cityName.toLowerCase() === decodedCity.toLowerCase() && r.type === type
        );
        res.json(mockResults);
    } catch (error) {
        const { cityName, type } = req.params;
        const decodedCity = decodeURIComponent(cityName);
        const mockResults = MOCK_RESTAURANTS.filter(
            (r: MockRestaurant) => r.cityName.toLowerCase() === decodedCity.toLowerCase() && r.type === type
        );
        res.json(mockResults);
    }
};
