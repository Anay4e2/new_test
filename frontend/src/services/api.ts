import axios from 'axios';
import type { TripRequest, TripResult, City, Place, Package } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach token to requests
api.interceptors.request.use((config) => {
    // Get token from localStorage (where Zustand persists it)
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
        try {
            const { state } = JSON.parse(authStorage);
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        } catch (e) {
            // Ignore parsing errors
        }
    }
    return config;
});

// Auth API
export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        role?: 'user' | 'admin';
        createdAt: string;
    };
    message?: string;
}

export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const adminLoginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/admin-login', { email, password });
    return response.data;
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
};

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

// Packages API
export const getPackages = async (): Promise<{ success: boolean; data: Package[] }> => {
    const response = await api.get('/packages');
    return response.data;
};

export const getPackageById = async (id: string): Promise<{ success: boolean; data: Package }> => {
    const response = await api.get(`/packages/${id}`);
    return response.data;
};

export const createPackage = async (data: Partial<Package>): Promise<{ success: boolean; data: Package }> => {
    const response = await api.post('/packages', data);
    return response.data;
};

export const updatePackage = async (id: string, data: Partial<Package>): Promise<{ success: boolean; data: Package }> => {
    const response = await api.put(`/packages/${id}`, data);
    return response.data;
};

export const deletePackage = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
};

export default api;
