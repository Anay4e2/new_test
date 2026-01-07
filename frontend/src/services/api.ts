import axios from 'axios';
import type { TripRequest, TripResult, City, Place } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Config API
export const getConfig = async () => {
    const response = await api.get('/config');
    return response.data;
};

// Places API
export const getPlaces = async (): Promise<Place[]> => {
    const response = await api.get('/places');
    return response.data;
};

export const getPlacesByState = async (stateCode: string): Promise<Place[]> => {
    const response = await api.get(`/places/by-state/${stateCode}`);
    return response.data;
};

// Cities API
export const getCities = async (): Promise<City[]> => {
    const response = await api.get('/cities');
    return response.data;
};

// Trip API
export const generateTrip = async (request: TripRequest): Promise<TripResult> => {
    const response = await api.post('/generate-trip', request);
    return response.data;
};

// Routes API
export const getRoutes = async () => {
    const response = await api.get('/routes');
    return response.data;
};

// Trains API
export const getTrainsBetweenCities = async (fromCity: string, toCity: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/trains/${fromCity}/${toCity}${params}`);
    return response.data;
};

// Distance API
export const getDistance = async (fromCity: string, toCity: string) => {
    const response = await api.get(`/distance/${fromCity}/${toCity}`);
    return response.data;
};

export default api;
