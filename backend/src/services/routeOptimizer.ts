// Route Optimizer - TSP approximation and transport suggestions
import City from '../models/City';
import Place from '../models/Place';
import Route, { IRoute, ITransportOption } from '../models/Route';
import mongoose from 'mongoose';

export interface OptimizeRouteRequest {
    placeIds?: string[];
    places?: any[]; // Allow passing places directly (e.g. from frontend state)
    startCityName?: string; // Optional starting point
}

export interface OptimizedPlace {
    _id: string;
    name: string;
    cityName: string;
    coordinates: { lat: number; lng: number };
    order: number;
}

export interface RouteSegment {
    from: string;
    to: string;
    distance: number;
    transportOptions: ITransportOption[];
    suggestedTransport: ITransportOption | null;
}

export interface OptimizeRouteResult {
    orderedPlaces: OptimizedPlace[];
    routeSegments: RouteSegment[];
    totalDistance: number;
    estimatedTravelTime: number; // hours
}

// Calculate distance between two coordinates (Haversine formula)
export function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Nearest Neighbor TSP approximation
function nearestNeighborTSP<T extends { lat: number; lng: number }>(
    points: T[],
    startIndex: number = 0
): number[] {
    const n = points.length;
    if (n === 0) return [];
    if (n === 1) return [0];

    const visited = new Set<number>();
    const order: number[] = [];
    let current = startIndex;

    while (order.length < n) {
        order.push(current);
        visited.add(current);

        let nearestDist = Infinity;
        let nearestIdx = -1;

        for (let i = 0; i < n; i++) {
            if (visited.has(i)) continue;
            const dist = haversineDistance(
                points[current].lat, points[current].lng,
                points[i].lat, points[i].lng
            );
            if (dist < nearestDist) {
                nearestDist = dist;
                nearestIdx = i;
            }
        }

        if (nearestIdx !== -1) {
            current = nearestIdx;
        }
    }

    return order;
}

// Calculate total route distance for a given order
function totalRouteDistance<T extends { lat: number; lng: number }>(
    points: T[],
    order: number[]
): number {
    let total = 0;
    for (let i = 0; i < order.length - 1; i++) {
        total += haversineDistance(
            points[order[i]].lat, points[order[i]].lng,
            points[order[i + 1]].lat, points[order[i + 1]].lng
        );
    }
    return total;
}

// 2-opt local search improvement on an existing route
function twoOptImprove<T extends { lat: number; lng: number }>(
    points: T[],
    order: number[],
    maxIterations: number = 100
): number[] {
    const n = order.length;
    if (n < 4) return order;

    let improved = [...order];
    let bestDist = totalRouteDistance(points, improved);
    let iteration = 0;
    let foundImprovement = true;

    while (foundImprovement && iteration < maxIterations) {
        foundImprovement = false;
        iteration++;

        for (let i = 1; i < n - 1; i++) {
            for (let j = i + 1; j < n; j++) {
                // Reverse the segment between i and j
                const newOrder = [
                    ...improved.slice(0, i),
                    ...improved.slice(i, j + 1).reverse(),
                    ...improved.slice(j + 1)
                ];
                const newDist = totalRouteDistance(points, newOrder);
                if (newDist < bestDist) {
                    improved = newOrder;
                    bestDist = newDist;
                    foundImprovement = true;
                }
            }
        }
    }

    return improved;
}

// Combined TSP: nearest-neighbor seed + 2-opt improvement
function optimizedTSP<T extends { lat: number; lng: number }>(
    points: T[],
    startIndex: number = 0
): number[] {
    const nnOrder = nearestNeighborTSP(points, startIndex);
    return twoOptImprove(points, nnOrder);
}

// Suggest best transport based on distance, budget, and time
function suggestBestTransport(
    options: ITransportOption[],
    budget: 'budget' | 'standard' | 'premium' = 'standard'
): ITransportOption | null {
    if (!options || options.length === 0) return null;

    // Filter by comfort level matching budget
    const comfortMap = {
        'budget': ['budget', 'standard'],
        'standard': ['standard', 'budget', 'premium'],
        'premium': ['premium', 'standard']
    };

    const preferred = comfortMap[budget];

    // Sort by: comfort match, then duration, then cost
    const sorted = [...options].sort((a, b) => {
        const aComfortScore = preferred.indexOf(a.comfort);
        const bComfortScore = preferred.indexOf(b.comfort);

        if (aComfortScore !== bComfortScore) {
            return aComfortScore - bComfortScore;
        }

        // Prefer shorter duration
        return a.duration - b.duration;
    });

    return sorted[0];
}

// Main route optimization function
export async function optimizeRoute(request: OptimizeRouteRequest): Promise<OptimizeRouteResult> {
    const { placeIds = [], places: providedPlaces = [], startCityName } = request;

    // 1. Fetch places from DB if IDs are provided
    let dbPlaces: any[] = [];

    // Filter out invalid ObjectIds to prevent CastError
    const validObjectIds = placeIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validObjectIds.length > 0) {
        dbPlaces = await Place.find({ _id: { $in: validObjectIds } });
    }

    // Combine DB places and provided places (remove duplicates by _id)
    const allPlacesMap = new Map<string, any>();

    // Add DB places first
    dbPlaces.forEach(p => {
        const id = p._id?.toString?.() || p._id;
        if (id) allPlacesMap.set(id, p);
    });

    // Add/Override with provided places (useful for temporary places from Google Maps)
    providedPlaces.forEach(p => {
        const id = p._id?.toString?.() || p._id;
        if (id) allPlacesMap.set(id, p);
    });

    const places = Array.from(allPlacesMap.values());

    if (places.length === 0) {
        throw new Error('No places found for the given IDs');
    }

    // 2. Group places by city and get city centroids
    const cityPlaces: Map<string, typeof places> = new Map();
    places.forEach(place => {
        const existing = cityPlaces.get(place.cityName) || [];
        existing.push(place);
        cityPlaces.set(place.cityName, existing);
    });

    // 3. Get city coordinates for inter-city optimization
    const cityNames = Array.from(cityPlaces.keys());
    const cities = await City.find({ name: { $in: cityNames } });

    const cityCoords: { name: string; lat: number; lng: number }[] = cities.map(c => ({
        name: c.name,
        lat: c.coordinates.lat,
        lng: c.coordinates.lng
    }));

    // Fallback: compute centroids from place coordinates for cities not in DB
    for (const cityName of cityNames) {
        if (!cityCoords.find(c => c.name === cityName)) {
            const cp = cityPlaces.get(cityName) || [];
            if (cp.length > 0) {
                const avgLat = cp.reduce((s, p) => s + (p.coordinates?.lat || 0), 0) / cp.length;
                const avgLng = cp.reduce((s, p) => s + (p.coordinates?.lng || 0), 0) / cp.length;
                cityCoords.push({ name: cityName, lat: avgLat, lng: avgLng });
            }
        }
    }

    // 4. Find starting city index
    let startIdx = 0;
    if (startCityName) {
        const idx = cityCoords.findIndex(c => c.name === startCityName);
        if (idx !== -1) startIdx = idx;
    }

    // 5. Optimize city order using TSP (nearest-neighbor + 2-opt)
    const cityOrder = optimizedTSP(cityCoords, startIdx);
    const orderedCityNames = cityOrder.map(i => cityCoords[i].name);

    // 6. Build ordered places list with Linked TSP (Chain cities together)
    const orderedPlaces: OptimizedPlace[] = [];
    let order = 1;

    // Track the coordinates of the last visited place to determine entry point for next city
    let lastPlaceCoords: { lat: number; lng: number } | null = null;

    for (const cityName of orderedCityNames) {
        const cityPlacesList = cityPlaces.get(cityName) || [];
        if (cityPlacesList.length === 0) continue;

        // Find the best starting place for this city
        let bestStartIdx = 0;

        if (lastPlaceCoords) {
            // If coming from another city, find the place closest to the previous city's last point
            let minDistance = Infinity;

            cityPlacesList.forEach((place, index) => {
                const dist = haversineDistance(
                    lastPlaceCoords!.lat, lastPlaceCoords!.lng,
                    place.coordinates.lat, place.coordinates.lng
                );
                if (dist < minDistance) {
                    minDistance = dist;
                    bestStartIdx = index;
                }
            });
        } else {
            // For the very first city, start with the highest rated place (Must See)
            // Sort by rating desc temporarily to find top rated, then find its index in original list
            const topRated = [...cityPlacesList].sort((a, b) => (b.rating || 4) - (a.rating || 4))[0];
            bestStartIdx = cityPlacesList.findIndex(p => p._id === topRated._id);
        }

        // Prepare points for TSP
        const points = cityPlacesList.map(p => p.coordinates);

        // Run TSP within the city starting from the optimal entry point (with 2-opt)
        const placeOrderIndices = optimizedTSP(points, bestStartIdx);

        // Add places to ordered list
        for (const idx of placeOrderIndices) {
            const place = cityPlacesList[idx];
            orderedPlaces.push({
                _id: (place._id?.toString?.() || place._id || `place-${order}`),
                name: place.name,
                cityName: place.cityName,
                coordinates: place.coordinates,
                order: order++
            });
        }

        // Update last coords for next iteration
        const lastIdx = placeOrderIndices[placeOrderIndices.length - 1];
        lastPlaceCoords = cityPlacesList[lastIdx].coordinates;
    }

    // 7. Calculate route segments
    const routeSegments: RouteSegment[] = [];
    let totalDistance = 0;
    let estimatedTravelTime = 0;

    // Helper: build transport options for a given distance
    const buildTransportOptions = (distance: number): ITransportOption[] => {
        const options: ITransportOption[] = [
            {
                mode: 'road',
                duration: distance / 60,
                estimatedCost: { min: Math.round(distance * 8), max: Math.round(distance * 15) },
                comfort: 'standard',
                bestDepartureTime: '06:00'
            },
            {
                mode: 'bus',
                duration: distance / 50,
                estimatedCost: { min: Math.round(distance * 2), max: Math.round(distance * 4) },
                comfort: 'budget',
                bestDepartureTime: '21:00'
            }
        ];
        if (distance > 200) {
            options.push({
                mode: 'train',
                duration: distance / 80,
                estimatedCost: { min: Math.round(distance * 1.5), max: Math.round(distance * 6) },
                comfort: 'standard',
                frequency: '2-3 daily',
                bestDepartureTime: '06:00'
            });
        }
        if (distance > 500) {
            options.push({
                mode: 'flight',
                duration: 1.5 + (distance / 800),
                estimatedCost: { min: 3000, max: 8000 },
                comfort: 'premium',
                frequency: '1-2 daily',
                bestDepartureTime: '08:00'
            });
        }
        return options;
    };

    if (orderedCityNames.length > 1) {
        // Inter-city segments
        for (let i = 0; i < orderedCityNames.length - 1; i++) {
            const fromCity = orderedCityNames[i];
            const toCity = orderedCityNames[i + 1];

            let route = await Route.findOne({ fromCity, toCity });
            if (!route) {
                route = await Route.findOne({ fromCity: toCity, toCity: fromCity });
            }

            const fromCoords = cityCoords.find(c => c.name === fromCity);
            const toCoords = cityCoords.find(c => c.name === toCity);
            if (!fromCoords || !toCoords) continue;
            const distance = route?.distance ||
                haversineDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);

            const transportOptions = route?.transportOptions?.length
                ? route.transportOptions
                : buildTransportOptions(distance);

            const suggested = suggestBestTransport(transportOptions);

            routeSegments.push({
                from: fromCity,
                to: toCity,
                distance: Math.round(distance),
                transportOptions,
                suggestedTransport: suggested
            });

            totalDistance += distance;
            estimatedTravelTime += suggested?.duration || (distance / 60);
        }
    } else if (orderedPlaces.length > 1) {
        // Single city/state — generate place-to-place segments
        for (let i = 0; i < orderedPlaces.length - 1; i++) {
            const fromPlace = orderedPlaces[i];
            const toPlace = orderedPlaces[i + 1];

            const distance = haversineDistance(
                fromPlace.coordinates.lat, fromPlace.coordinates.lng,
                toPlace.coordinates.lat, toPlace.coordinates.lng
            );

            const transportOptions = buildTransportOptions(distance);
            const suggested = suggestBestTransport(transportOptions);

            routeSegments.push({
                from: fromPlace.name,
                to: toPlace.name,
                distance: Math.round(distance),
                transportOptions,
                suggestedTransport: suggested
            });

            totalDistance += distance;
            estimatedTravelTime += suggested?.duration || (distance / 60);
        }
    }

    return {
        orderedPlaces,
        routeSegments,
        totalDistance: Math.round(totalDistance),
        estimatedTravelTime: Math.round(estimatedTravelTime * 10) / 10
    };
}

// Get transport options between two cities
export async function getTransportOptions(
    fromCity: string,
    toCity: string
): Promise<RouteSegment | null> {
    let route = await Route.findOne({ fromCity, toCity });
    if (!route) {
        route = await Route.findOne({ fromCity: toCity, toCity: fromCity });
    }

    if (!route) {
        // Get cities for distance calculation
        const cities = await City.find({ name: { $in: [fromCity, toCity] } });
        if (cities.length < 2) return null;

        const from = cities.find(c => c.name === fromCity)!;
        const to = cities.find(c => c.name === toCity)!;
        const distance = haversineDistance(
            from.coordinates.lat, from.coordinates.lng,
            to.coordinates.lat, to.coordinates.lng
        );

        // Return default options
        return {
            from: fromCity,
            to: toCity,
            distance: Math.round(distance),
            transportOptions: [
                {
                    mode: 'road',
                    duration: distance / 60,
                    estimatedCost: { min: distance * 8, max: distance * 15 },
                    comfort: 'standard',
                    bestDepartureTime: '06:00'
                }
            ],
            suggestedTransport: null
        };
    }

    return {
        from: route.fromCity,
        to: route.toCity,
        distance: route.distance,
        transportOptions: route.transportOptions,
        suggestedTransport: suggestBestTransport(route.transportOptions)
    };
}
