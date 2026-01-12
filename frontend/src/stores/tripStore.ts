import { create } from 'zustand';

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

    // === OPTIMIZE ROUTE (using Google Directions API) ===
    optimizeRoute: async () => {
        const places = get().selectedPlaces;
        if (places.length < 2) {
            // No need to optimize single place
            set({
                optimizedRoute: places.map((p, i) => ({ ...p, order: i + 1 })),
                routeSegments: [],
                showRouteOnMap: true
            });
            return;
        }

        set({ isOptimizing: true });

        try {
            // Check if Google Maps is loaded
            if (typeof google === 'undefined' || !google.maps) {
                throw new Error('Google Maps not loaded');
            }

            const directionsService = new google.maps.DirectionsService();

            // Prepare waypoints (all places except first and last)
            const origin = places[0].coordinates;
            const destination = places[places.length - 1].coordinates;
            const waypoints = places.slice(1, -1).map(p => ({
                location: new google.maps.LatLng(p.coordinates.lat, p.coordinates.lng),
                stopover: true
            }));

            const result = await directionsService.route({
                origin: new google.maps.LatLng(origin.lat, origin.lng),
                destination: new google.maps.LatLng(destination.lat, destination.lng),
                waypoints,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            });

            // DirectionsResult is returned if successful (promise rejects on error)
            if (result.routes && result.routes.length > 0) {
                // Get optimized order from waypoint_order
                const waypointOrder = result.routes[0].waypoint_order;
                const middlePlaces = places.slice(1, -1);

                // Build optimized route
                const optimized: OptimizedPlace[] = [];

                // First place
                optimized.push({ ...places[0], order: 1 });

                // Reordered waypoints
                waypointOrder.forEach((index, i) => {
                    optimized.push({ ...middlePlaces[index], order: i + 2 });
                });

                // Last place
                optimized.push({ ...places[places.length - 1], order: optimized.length + 1 });

                // Calculate total distance and time
                const legs = result.routes[0].legs;
                let totalDistance = 0;
                let totalDuration = 0;

                const routeSegments: RouteSegment[] = legs.map((leg, i) => {
                    totalDistance += leg.distance?.value || 0;
                    totalDuration += leg.duration?.value || 0;

                    return {
                        from: i === 0 ? places[0].name : optimized[i].name,
                        to: optimized[i + 1]?.name || places[places.length - 1].name,
                        distance: Math.round((leg.distance?.value || 0) / 1000), // Convert to km
                        transportOptions: [{
                            mode: 'road' as const,
                            duration: Math.round((leg.duration?.value || 0) / 3600 * 10) / 10, // Convert to hours
                            estimatedCost: { min: 0, max: 0 },
                            comfort: 'standard' as const
                        }],
                        suggestedTransport: {
                            mode: 'road' as const,
                            duration: Math.round((leg.duration?.value || 0) / 3600 * 10) / 10,
                            estimatedCost: { min: 0, max: 0 },
                            comfort: 'standard' as const
                        }
                    };
                });

                set({
                    optimizedRoute: optimized,
                    routeSegments,
                    totalDistance: Math.round(totalDistance / 1000), // km
                    estimatedTravelTime: Math.round(totalDuration / 3600 * 10) / 10, // hours
                    showRouteOnMap: true,
                    isOptimizing: false
                });
            } else {
                throw new Error('No routes found');
            }
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
