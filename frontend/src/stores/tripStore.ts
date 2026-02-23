import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Place {
    _id: string;
    name: string;
    cityName: string;
    type?: string;
    coordinates: { lat: number; lng: number };
    description?: string;
    rating?: number;
    visitDuration?: string;
}

export interface TransportOption {
    mode: 'road' | 'train' | 'flight' | 'bus';
    duration: number;
    estimatedCost: { min: number; max: number };
    frequency?: string;
    bestDepartureTime?: string;
    comfort: 'budget' | 'standard' | 'premium';
}

export interface RouteSegment {
    from: string;
    to: string;
    distance: number;
    transportOptions: TransportOption[];
    suggestedTransport: TransportOption | null;
}

export interface OptimizedPlace extends Place {
    order: number;
}

interface TripStore {
    // === SELECTED PLACES ===
    selectedPlaces: Place[];

    // === DAYS CONFIGURATION ===
    daysPerCity: Record<string, number>;  // cityName -> days

    // === OPTIMIZED ROUTE ===
    optimizedRoute: OptimizedPlace[];
    routeSegments: RouteSegment[];
    totalDistance: number;
    estimatedTravelTime: number;

    // === UI STATE ===
    isOptimizing: boolean;
    isGenerating: boolean;
    showRouteOnMap: boolean;

    // === TRIP DATE ===
    tripStartDate: string | null;

    // === ACTIONS ===
    addPlace: (place: Place) => void;
    removePlace: (placeId: string) => void;
    togglePlace: (place: Place) => void;
    isPlaceSelected: (placeId: string) => boolean;
    clearAllPlaces: () => void;

    setDaysForCity: (cityName: string, days: number) => void;

    reorderPlaces: (fromIndex: number, toIndex: number) => void;

    optimizeRoute: () => Promise<void>;

    setShowRouteOnMap: (show: boolean) => void;
    setTripStartDate: (date: string | null) => void;

    // Get unique cities from selected places
    getSelectedCities: () => string[];

    // Get route coordinates for map polyline
    getRouteCoordinates: () => [number, number][];
}

export const useTripStore = create<TripStore>((set, get) => ({
    // Initial State
    selectedPlaces: [],
    daysPerCity: {},
    optimizedRoute: [],
    routeSegments: [],
    totalDistance: 0,
    estimatedTravelTime: 0,
    isOptimizing: false,
    isGenerating: false,
    showRouteOnMap: false,
    tripStartDate: null,

    // === PLACE ACTIONS ===
    addPlace: (place) => {
        const current = get().selectedPlaces;
        if (!current.find(p => p._id === place._id)) {
            set({
                selectedPlaces: [...current, place],
                // Reset optimization when places change
                optimizedRoute: [],
                routeSegments: [],
                showRouteOnMap: false
            });

            // Set default days for city if not set
            const daysPerCity = get().daysPerCity;
            if (!daysPerCity[place.cityName]) {
                set({ daysPerCity: { ...daysPerCity, [place.cityName]: 2 } });
            }
        }
    },

    removePlace: (placeId) => {
        const current = get().selectedPlaces;
        const place = current.find(p => p._id === placeId);
        const newPlaces = current.filter(p => p._id !== placeId);

        set({
            selectedPlaces: newPlaces,
            optimizedRoute: [],
            routeSegments: [],
            showRouteOnMap: false
        });

        // Remove city days if no more places from that city
        if (place) {
            const remainingFromCity = newPlaces.filter(p => p.cityName === place.cityName);
            if (remainingFromCity.length === 0) {
                const { [place.cityName]: _, ...restDays } = get().daysPerCity;
                set({ daysPerCity: restDays });
            }
        }
    },

    togglePlace: (place) => {
        const isSelected = get().isPlaceSelected(place._id);
        if (isSelected) {
            get().removePlace(place._id);
        } else {
            get().addPlace(place);
        }
    },

    isPlaceSelected: (placeId) => {
        return get().selectedPlaces.some(p => p._id === placeId);
    },

    clearAllPlaces: () => {
        set({
            selectedPlaces: [],
            daysPerCity: {},
            optimizedRoute: [],
            routeSegments: [],
            totalDistance: 0,
            estimatedTravelTime: 0,
            showRouteOnMap: false
        });
    },

    // === DAYS CONFIGURATION ===
    setDaysForCity: (cityName, days) => {
        set({
            daysPerCity: {
                ...get().daysPerCity,
                [cityName]: Math.max(1, days)
            }
        });
    },

    // === REORDER (Manual) ===
    reorderPlaces: (fromIndex, toIndex) => {
        const places = [...get().selectedPlaces];
        const [moved] = places.splice(fromIndex, 1);
        places.splice(toIndex, 0, moved);
        set({
            selectedPlaces: places,
            // Clear optimized route when manually reordering
            optimizedRoute: [],
            routeSegments: [],
            showRouteOnMap: false
        });
    },

    // === OPTIMIZE ROUTE (using Backward Algorithm) ===
    optimizeRoute: async () => {
        const places = get().selectedPlaces;
        if (places.length < 2) {
            // No need to optimize single place
            set({
                optimizedRoute: places.map((p, i) => ({ ...p, order: i + 1 })),
                routeSegments: [],
                showRouteOnMap: true,
                isOptimizing: false
            });
            return;
        }

        set({ isOptimizing: true });

        try {
            // Call Backend API
            const response = await axios.post(`${API_BASE_URL}/routes/optimize`, {
                placeIds: places.map(p => p._id),
                places: places
            });

            const { orderedPlaces, routeSegments, totalDistance, estimatedTravelTime } = response.data;

            // Merge optimized order with full place details
            const fullOptimizedPlaces = orderedPlaces.map((op: any) => {
                const original = places.find(p => p._id === op._id);
                return { ...original, ...op };
            });

            set({
                optimizedRoute: fullOptimizedPlaces,
                routeSegments, // Backend returns full segments with transport options
                totalDistance, // km
                estimatedTravelTime, // hours
                showRouteOnMap: true,
                isOptimizing: false
            });
        } catch (error) {
            console.error('Failed to optimize route:', error);
            // Fallback: just use selection order
            set({
                optimizedRoute: places.map((p, i) => ({ ...p, order: i + 1 })),
                routeSegments: [],
                showRouteOnMap: true,
                isOptimizing: false
            });
        }
    },

    setShowRouteOnMap: (show) => {
        set({ showRouteOnMap: show });
    },

    setTripStartDate: (date) => {
        set({ tripStartDate: date });
    },

    // === GETTERS ===
    getSelectedCities: () => {
        const places = get().selectedPlaces;
        return [...new Set(places.map(p => p.cityName))];
    },

    getRouteCoordinates: () => {
        const optimized = get().optimizedRoute;
        if (optimized.length === 0) {
            // Use selection order if not optimized
            return get().selectedPlaces.map(p => [p.coordinates.lat, p.coordinates.lng] as [number, number]);
        }
        return optimized.map(p => [p.coordinates.lat, p.coordinates.lng] as [number, number]);
    }
}));
