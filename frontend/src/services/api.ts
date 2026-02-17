import axios from 'axios';
import type { TripRequest, TripResult, City, Place, Package, Hotel, BudgetTier, Restaurant, SavedTrip, FavoritePlace, PackingList, TrainLiveStatus, Review, ParsedTripQuery, TripSuggestion, Festival, EmergencyInfo, BookingLink } from '../types';

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

// Hotels API
export const getHotels = async (): Promise<Hotel[]> => {
    const response = await api.get('/hotels');
    return response.data;
};

export const getHotelsByCity = async (cityName: string): Promise<Hotel[]> => {
    const response = await api.get(`/hotels/city/${encodeURIComponent(cityName)}`);
    return response.data;
};

export const getHotelsByTier = async (cityName: string, tier: BudgetTier): Promise<Hotel[]> => {
    const response = await api.get(`/hotels/city/${encodeURIComponent(cityName)}/tier/${tier}`);
    return response.data;
};

// Restaurants API
export const getRestaurants = async (): Promise<Restaurant[]> => {
    const response = await api.get('/restaurants');
    return response.data;
};

export const getRestaurantsByCity = async (cityName: string): Promise<Restaurant[]> => {
    const response = await api.get(`/restaurants/city/${encodeURIComponent(cityName)}`);
    return response.data;
};

export const getRestaurantsByType = async (cityName: string, type: string): Promise<Restaurant[]> => {
    const response = await api.get(`/restaurants/city/${encodeURIComponent(cityName)}/type/${type}`);
    return response.data;
};

// Saved Trips API
export const saveTrip = async (title: string, tripRequest: any, tripResult: any): Promise<{ success: boolean; trip: SavedTrip }> => {
    const response = await api.post('/my-trips', { title, tripRequest, tripResult });
    return response.data;
};

export const getMyTrips = async (): Promise<{ success: boolean; trips: SavedTrip[] }> => {
    const response = await api.get('/my-trips');
    return response.data;
};

export const getTrip = async (id: string): Promise<{ success: boolean; trip: SavedTrip }> => {
    const response = await api.get(`/my-trips/${id}`);
    return response.data;
};

export const updateTrip = async (id: string, data: { title?: string; notes?: string; isFavorite?: boolean }): Promise<{ success: boolean; trip: SavedTrip }> => {
    const response = await api.put(`/my-trips/${id}`, data);
    return response.data;
};

export const deleteTrip = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/my-trips/${id}`);
    return response.data;
};

// Favorites API
export const toggleFavoritePlace = async (placeId: string, placeName: string, cityName: string): Promise<{ success: boolean; favorited: boolean }> => {
    const response = await api.post('/favorites/toggle', { placeId, placeName, cityName });
    return response.data;
};

export const getMyFavorites = async (): Promise<{ success: boolean; favorites: FavoritePlace[] }> => {
    const response = await api.get('/favorites');
    return response.data;
};

// Share API
export const createShareLink = async (tripRequest: any, tripResult: any): Promise<{ success: boolean; shareId: string; shareUrl: string }> => {
    const response = await api.post('/share', { tripRequest, tripResult });
    return response.data;
};

export const getSharedTrip = async (shareId: string): Promise<{ success: boolean; tripRequest: any; tripResult: any; viewCount: number }> => {
    const response = await api.get(`/share/${shareId}`);
    return response.data;
};

// Weather API
export const getWeatherForecast = async (cityName: string, date?: string): Promise<{ success: boolean; data: { temp: number; humidity: number; condition: string; icon: string; advisory?: string } }> => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/weather/forecast/${encodeURIComponent(cityName)}${params}`);
    return response.data;
};

export const getSeasonalWeather = async (cityName: string, month: number): Promise<{ success: boolean; data: { temp: number; humidity: number; condition: string; icon: string; advisory?: string } }> => {
    const response = await api.get(`/weather/seasonal/${encodeURIComponent(cityName)}/${month}`);
    return response.data;
};

// Itinerary Validation API
export const validateItinerary = async (itinerary: any[]): Promise<{ itinerary: any[]; summary: { totalCost: number; totalDistance: number; feasibility: string } }> => {
    const response = await api.post('/itinerary/validate', { itinerary });
    return response.data;
};

// Trip Comparison API
export const generateTripVariants = async (request: TripRequest): Promise<{ variants: { label: string; tripResult: TripResult }[] }> => {
    const response = await api.post('/generate-trip/compare', request);
    return response.data;
};

// Itinerary Export API
export const getWhatsAppText = async (tripResult: TripResult): Promise<{ text: string; whatsappUrl: string }> => {
    const response = await api.post('/itinerary/whatsapp-text', tripResult);
    return response.data;
};

export const sendItineraryEmail = async (
    email: string,
    tripResult: TripResult,
    attachPdf: boolean = false
): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/itinerary/send-email', { email, tripResult, attachPdf });
    return response.data;
};

// Packing List API
export const getPackingList = async (
    tripResult: TripResult,
    month: number,
    constraints?: TripRequest['constraints'],
    budget?: string
): Promise<PackingList> => {
    const response = await api.post('/itinerary/packing-list', { tripResult, month, constraints, budget });
    return response.data;
};

// Train Live Status API
export const getTrainLiveStatus = async (trainNumber: string, date?: string): Promise<TrainLiveStatus> => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/trains/${trainNumber}/status${params}`);
    return response.data;
};

// ========== AI Suggestion API ==========

export const parseTripQuery = async (query: string): Promise<ParsedTripQuery> => {
    const response = await api.post('/suggest-trip', { query });
    return response.data;
};

export const getTripIdeas = async (interests: string[]): Promise<TripSuggestion[]> => {
    const params = interests.length > 0 ? `?interests=${interests.join(',')}` : '';
    const response = await api.get(`/trip-ideas${params}`);
    return response.data;
};

export default api;

// ========== Review API ==========

export const createReview = async (data: {
    placeId: string;
    placeName: string;
    cityName?: string;
    rating: number;
    title?: string;
    comment?: string;
    visitDate?: string;
}): Promise<{ success: boolean; review: Review }> => {
    const response = await api.post('/reviews', data);
    return response.data;
};

export const getReviewsForPlace = async (
    placeId: string,
    options?: { sort?: string; limit?: number; offset?: number }
): Promise<{
    success: boolean;
    reviews: Review[];
    totalCount: number;
    distribution: Record<number, number>;
    hasMore: boolean;
}> => {
    const params = new URLSearchParams();
    if (options?.sort) params.set('sort', options.sort);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/reviews/place/${placeId}${query}`);
    return response.data;
};

export const getMyReviews = async (): Promise<{ success: boolean; reviews: Review[] }> => {
    const response = await api.get('/reviews/my');
    return response.data;
};

export const markReviewHelpful = async (reviewId: string): Promise<{ success: boolean; helpfulCount: number }> => {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
};

export const deleteReview = async (reviewId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
};

// ========== Festival API ==========

export const getAllFestivals = async (): Promise<Festival[]> => {
    const response = await api.get('/festivals');
    return response.data.festivals;
};

export const getFestivalsByMonth = async (month: number): Promise<Festival[]> => {
    const response = await api.get(`/festivals/month/${month}`);
    return response.data.festivals;
};

export const getUpcomingFestivals = async (): Promise<Festival[]> => {
    const response = await api.get('/festivals/upcoming');
    return response.data.festivals;
};

export const getFestivalsByState = async (stateCode: string): Promise<Festival[]> => {
    const response = await api.get(`/festivals/state/${stateCode}`);
    return response.data.festivals;
};

// ========== Safety API ==========

export const getSafetyInfo = async (cityName: string): Promise<EmergencyInfo> => {
    const response = await api.get(`/safety/${encodeURIComponent(cityName)}`);
    return response.data.data;
};

export const getAllSafetyInfo = async (): Promise<Record<string, EmergencyInfo>> => {
    const response = await api.get('/safety');
    return response.data.data;
};

// ========== Booking Links API ==========

export const getBookingLinks = async (from: string, to: string, date: string, mode: string, distance?: number): Promise<{ links: BookingLink[]; disclaimer: string }> => {
    const params: Record<string, string> = { from, to, date, mode };
    if (distance) params.distance = String(distance);
    const response = await api.get('/itinerary/booking-links', { params });
    return response.data;
};
