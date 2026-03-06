import axios from 'axios';
import type { TripRequest, TripResult, City, Place, Package, Hotel, BudgetTier, Restaurant, SavedTrip, FavoritePlace, PackingList, TrainLiveStatus, Review, ParsedTripQuery, TripSuggestion, Festival, EmergencyInfo, BookingLink, Expense, ExpenseSummary, TripGroup, GroupChat, GroupPoll, PublicTrip, TrendingDestination, UserPublicProfile, AppNotification, JournalEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

// Auto-logout on 401 (stale / invalid token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear the persisted auth state so the user is redirected to login
            localStorage.removeItem('auth-storage');
            // Redirect to login (avoid redirect loop if already on /login)
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

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

export const forgotPasswordApi = async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPasswordApi = async (token: string, password: string): Promise<AuthResponse> => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
};

export const updateProfileApi = async (data: { name?: string; email?: string }): Promise<AuthResponse> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
};

export const changePasswordApi = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
};

export const googleAuthApi = async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
};

// Admin Management API
export const getAllPlacesAdminApi = async (params: { page?: number; limit?: number; search?: string; type?: string } = {}) => {
    const response = await api.get('/admin/places', { params });
    return response.data;
};

export const createPlaceApi = async (data: any) => {
    const response = await api.post('/admin/places', data);
    return response.data;
};

export const updatePlaceApi = async (id: string, data: any) => {
    const response = await api.put(`/admin/places/${id}`, data);
    return response.data;
};

export const deletePlaceApi = async (id: string) => {
    const response = await api.delete(`/admin/places/${id}`);
    return response.data;
};

export const getAllTripsAdminApi = async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const response = await api.get('/admin/trips', { params });
    return response.data;
};

export const deleteTripAdminApi = async (id: string) => {
    const response = await api.delete(`/admin/trips/${id}`);
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

export const getPlacePhotos = async (placeName: string, city?: string): Promise<{ photos: string[]; source: string }> => {
    const response = await api.get(`/places/${encodeURIComponent(placeName)}/photos`, {
        params: city ? { city } : undefined,
    });
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

export const getTransportOptions = async (from: string, to: string) => {
    const response = await api.get('/routes/transport', { params: { from, to } });
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

export const cloneTripApi = async (id: string): Promise<{ success: boolean; trip: SavedTrip }> => {
    const response = await api.post(`/my-trips/${id}/clone`);
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

// PNR Status
export const checkPNRStatus = async (pnrNumber: string) => {
    const response = await api.get(`/trains/pnr/${pnrNumber}`);
    return response.data;
};

// Station search
export const searchStation = async (query: string) => {
    const response = await api.get(`/trains/search/station?query=${encodeURIComponent(query)}`);
    return response.data;
};

// Station codes
export const getStationCodes = async () => {
    const response = await api.get('/trains/stations');
    return response.data;
};

// Live station board
export const getLiveStationBoard = async (stationCode: string, hours?: number) => {
    const params = hours ? `?hours=${hours}` : '';
    const response = await api.get(`/trains/station/${stationCode}/live${params}`);
    return response.data;
};

// Train schedule
export const getTrainSchedule = async (trainNumber: string) => {
    const response = await api.get(`/trains/${trainNumber}/schedule`);
    return response.data;
};

// Seat availability
export const checkSeatAvailability = async (trainNumber: string, from: string, to: string, classType: string, date: string, quota?: string) => {
    const params = new URLSearchParams({ from, to, class: classType, date, quota: quota || 'GN' });
    const response = await api.get(`/trains/${trainNumber}/availability?${params}`);
    return response.data;
};

// Train fare
export const getTrainFare = async (trainNumber: string, from: string, to: string) => {
    const response = await api.get(`/trains/${trainNumber}/fare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
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

export const updateReviewApi = async (reviewId: string, data: { rating?: number; title?: string; comment?: string; visitDate?: string }): Promise<{ success: boolean; review: Review }> => {
    const response = await api.put(`/reviews/${reviewId}`, data);
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

// ========== Calendar Sync API ==========

export const downloadICalFile = async (tripResult: TripResult, startDate: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/itinerary/calendar/ical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripResult, startDate }),
    });
    if (!response.ok) throw new Error('Failed to generate iCal file');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-itinerary-${tripResult.itinerary.length}days.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const getGoogleCalendarUrls = async (tripResult: TripResult, startDate: string): Promise<string[]> => {
    const response = await api.post('/itinerary/calendar/google-urls', { tripResult, startDate });
    return response.data.urls;
};

// ========== Expense Tracker API ==========

export const addExpense = async (data: { tripId: string; category: string; amount: number; description?: string; day: number; city?: string; paymentMethod?: string }): Promise<{ success: boolean; expense: Expense }> => {
    const response = await api.post('/expenses', data);
    return response.data;
};

export const getExpensesByTrip = async (tripId: string): Promise<{ success: boolean; expenses: Expense[]; categoryTotals: Record<string, number>; total: number; count: number }> => {
    const response = await api.get(`/expenses/trip/${tripId}`);
    return response.data;
};

export const getExpenseSummary = async (tripId: string): Promise<{ success: boolean } & ExpenseSummary> => {
    const response = await api.get(`/expenses/trip/${tripId}/summary`);
    return response.data;
};

export const updateExpense = async (id: string, data: Partial<Expense>): Promise<{ success: boolean; expense: Expense }> => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
};

export const deleteExpense = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
};

// ========== Group Trip API ==========

export const createGroup = async (data: { tripId: string; name: string }): Promise<{ success: boolean; group: TripGroup }> => {
    const response = await api.post('/groups', data);
    return response.data;
};

export const getMyGroups = async (): Promise<{ success: boolean; groups: TripGroup[] }> => {
    const response = await api.get('/groups');
    return response.data;
};

export const getGroup = async (id: string): Promise<{ success: boolean; group: TripGroup }> => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
};

export const inviteMembers = async (groupId: string, data: { emails: string[]; role: string; message?: string }): Promise<{ success: boolean; added: string[]; group: TripGroup }> => {
    const response = await api.post(`/groups/${groupId}/invite`, data);
    return response.data;
};

export const respondToInvite = async (groupId: string, inviteResponse: 'accepted' | 'declined'): Promise<{ success: boolean; group: TripGroup }> => {
    const response = await api.post(`/groups/${groupId}/respond`, { response: inviteResponse });
    return response.data;
};

export const addChatMessage = async (groupId: string, message: string): Promise<{ success: boolean; message: GroupChat }> => {
    const response = await api.post(`/groups/${groupId}/chat`, { message });
    return response.data;
};

export const getChatHistory = async (groupId: string): Promise<{ success: boolean; messages: GroupChat[] }> => {
    const response = await api.get(`/groups/${groupId}/chat`);
    return response.data;
};

export const createPoll = async (groupId: string, data: { question: string; options: string[] }): Promise<{ success: boolean; poll: GroupPoll }> => {
    const response = await api.post(`/groups/${groupId}/polls`, data);
    return response.data;
};

export const votePoll = async (groupId: string, pollId: string, optionIndex: number): Promise<{ success: boolean; poll: GroupPoll }> => {
    const response = await api.post(`/groups/${groupId}/polls/${pollId}/vote`, { optionIndex });
    return response.data;
};

export const closePoll = async (groupId: string, pollId: string): Promise<{ success: boolean; poll: GroupPoll }> => {
    const response = await api.post(`/groups/${groupId}/polls/${pollId}/close`);
    return response.data;
};

export const removeMember = async (groupId: string, memberId: string): Promise<{ success: boolean; group: TripGroup }> => {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
};

// Feed API
export const getPublicTrips = async (params: { sort?: string; state?: string; duration?: string; budget?: string; tag?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; trips: PublicTrip[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }> => {
    const response = await api.get('/feed', { params });
    return response.data;
};

export const likeTripApi = async (tripId: string): Promise<{ success: boolean; liked: boolean; likes: number }> => {
    const response = await api.post(`/feed/${tripId}/like`);
    return response.data;
};

export const getTrendingDestinations = async (): Promise<{ success: boolean; destinations: TrendingDestination[] }> => {
    const response = await api.get('/feed/trending');
    return response.data;
};

export const getUserPublicProfile = async (userId: string): Promise<{ success: boolean; profile: UserPublicProfile; trips: any[] }> => {
    const response = await api.get(`/feed/user/${userId}`);
    return response.data;
};

export const publishTripApi = async (tripId: string, data: { isPublic: boolean; tags?: string[]; coverImage?: string }): Promise<{ success: boolean; message: string; trip: any }> => {
    const response = await api.put(`/feed/${tripId}/publish`, data);
    return response.data;
};

// === Notifications ===

export const getNotificationsApi = async (params: { type?: string; isRead?: string; page?: number; limit?: number } = {}): Promise<{ success: boolean; notifications: AppNotification[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
};

export const getUnreadCountApi = async (): Promise<{ success: boolean; count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
};

export const markNotificationReadApi = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};

export const markAllNotificationsReadApi = async (): Promise<{ success: boolean; markedCount: number }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
};

export const deleteNotificationApi = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
};

// ── Journal API ──

export const createJournalEntry = async (data: { tripId: string; day: number; city: string; title: string; content?: string; mood?: string; photos?: string[]; placeName?: string; isPublic?: boolean }): Promise<{ success: boolean; entry: JournalEntry }> => {
    const response = await api.post('/journal', data);
    return response.data;
};

export const getJournalEntries = async (tripId: string): Promise<{ success: boolean; entries: JournalEntry[]; count: number }> => {
    const response = await api.get(`/journal/trip/${tripId}`);
    return response.data;
};

export const updateJournalEntry = async (id: string, data: Partial<JournalEntry>): Promise<{ success: boolean; entry: JournalEntry }> => {
    const response = await api.put(`/journal/${id}`, data);
    return response.data;
};

export const deleteJournalEntry = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/journal/${id}`);
    return response.data;
};

export const getPublicJournal = async (tripId: string): Promise<{ success: boolean; entries: JournalEntry[]; count: number; tripTitle: string }> => {
    const response = await api.get(`/journal/trip/${tripId}/public`);
    return response.data;
};

export const uploadJournalPhoto = async (photo: string | File): Promise<{ success: boolean; url: string; publicId?: string }> => {
    if (photo instanceof File) {
        const formData = new FormData();
        formData.append('photo', photo);
        const response = await api.post('/journal/upload-photo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }
    const response = await api.post('/journal/upload-photo', { photo });
    return response.data;
};

export const getJournalEntryCount = async (tripId: string): Promise<{ success: boolean; count: number }> => {
    const response = await api.get(`/journal/trip/${tripId}/count`);
    return response.data;
};

// ========== Postcard API ==========

export const savePostcard = async (imageBlob: Blob, data: { tripId?: string; template?: string; title?: string; message?: string }): Promise<{ success: boolean; postcard: any }> => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'postcard.png');
    if (data.tripId) formData.append('tripId', data.tripId);
    if (data.template) formData.append('template', data.template);
    if (data.title) formData.append('title', data.title);
    if (data.message) formData.append('message', data.message);
    const response = await api.post('/postcards', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
};

export const getMyPostcards = async (): Promise<{ success: boolean; postcards: any[] }> => {
    const response = await api.get('/postcards');
    return response.data;
};

export const deletePostcardApi = async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/postcards/${id}`);
    return response.data;
};

export const sendPostcardEmail = async (id: string, recipientEmail: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/postcards/${id}/send`, { recipientEmail });
    return response.data;
};

// Currency API
export const getExchangeRates = async () => {
    const response = await api.get('/currency/rates');
    return response.data;
};

export const convertCurrencyApi = async (amount: number, from: string, to: string) => {
    const response = await api.get('/currency/convert', { params: { amount, from, to } });
    return response.data;
};

// Checklist API
export const getChecklistsApi = async (tripId?: string) => {
    const params = tripId ? { tripId } : {};
    const response = await api.get('/checklists', { params });
    return response.data;
};

export const createChecklistApi = async (title: string, tripId?: string) => {
    const response = await api.post('/checklists', { title, tripId });
    return response.data;
};

export const updateChecklistApi = async (id: string, data: { title?: string; items?: any[] }) => {
    const response = await api.put(`/checklists/${id}`, data);
    return response.data;
};

export const addChecklistItemApi = async (id: string, label: string, category?: string) => {
    const response = await api.post(`/checklists/${id}/items`, { label, category });
    return response.data;
};

export const deleteChecklistApi = async (id: string) => {
    const response = await api.delete(`/checklists/${id}`);
    return response.data;
};

// Health / Integration Status API
export const getHealthStatus = async () => {
    const response = await api.get('/config/health');
    return response.data;
};
