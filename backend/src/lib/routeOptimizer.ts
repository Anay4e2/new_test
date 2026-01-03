// Route Optimizer - TSP approximation and transport suggestions
import City from '../models/City';
import Place from '../models/Place';
import Route, { IRoute, ITransportOption } from '../models/Route';

export interface OptimizeRouteRequest {
    placeIds: string[];
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
function haversineDistance(
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
    const { placeIds, startCityName } = request;

    // 1. Fetch all places
    const places = await Place.find({ _id: { $in: placeIds } });
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

    const cityCoords = cities.map(c => ({
        name: c.name,
        lat: c.coordinates.lat,
        lng: c.coordinates.lng
    }));

    // 4. Find starting city index
    let startIdx = 0;
    if (startCityName) {
        const idx = cityCoords.findIndex(c => c.name === startCityName);
        if (idx !== -1) startIdx = idx;
    }

    // 5. Optimize city order using TSP
    const cityOrder = nearestNeighborTSP(cityCoords, startIdx);
    const orderedCityNames = cityOrder.map(i => cityCoords[i].name);

    // 6. Build ordered places list (places within same city stay grouped)
    const orderedPlaces: OptimizedPlace[] = [];
    let order = 1;

    for (const cityName of orderedCityNames) {
        const cityPlacesList = cityPlaces.get(cityName) || [];
        // Sort places within city by rating (best first)
        cityPlacesList.sort((a, b) => (b.rating || 4) - (a.rating || 4));

        for (const place of cityPlacesList) {
            orderedPlaces.push({
                _id: place._id.toString(),
                name: place.name,
                cityName: place.cityName,
                coordinates: place.coordinates,
                order: order++
            });
        }
    }

    // 7. Calculate route segments between cities
    const routeSegments: RouteSegment[] = [];
    let totalDistance = 0;
    let estimatedTravelTime = 0;

    for (let i = 0; i < orderedCityNames.length - 1; i++) {
        const fromCity = orderedCityNames[i];
        const toCity = orderedCityNames[i + 1];

        // Try to find route in database
        let route = await Route.findOne({ fromCity, toCity });
        if (!route) {
            // Try reverse
            route = await Route.findOne({ fromCity: toCity, toCity: fromCity });
        }

        // Calculate distance from coordinates if no route found
        const fromCoords = cityCoords.find(c => c.name === fromCity)!;
        const toCoords = cityCoords.find(c => c.name === toCity)!;
        const distance = route?.distance ||
            haversineDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);

        // Default transport options if none in DB
        const defaultOptions: ITransportOption[] = [
            {
                mode: 'road',
                duration: distance / 60, // ~60 km/h avg
                estimatedCost: { min: distance * 8, max: distance * 15 },
                comfort: 'standard',
                bestDepartureTime: '06:00'
            },
            {
                mode: 'bus',
                duration: distance / 50,
                estimatedCost: { min: distance * 2, max: distance * 4 },
                comfort: 'budget',
                bestDepartureTime: '21:00' // Night bus
            }
        ];

        // Add train option for longer distances
        if (distance > 200) {
            defaultOptions.push({
                mode: 'train',
                duration: distance / 80,
                estimatedCost: { min: distance * 1.5, max: distance * 6 },
                comfort: 'standard',
                frequency: '2-3 daily',
                bestDepartureTime: '06:00'
            });
        }

        // Add flight option for very long distances
        if (distance > 500) {
            defaultOptions.push({
                mode: 'flight',
                duration: 1.5 + (distance / 800), // ~800 km/h + 1.5hr airport time
                estimatedCost: { min: 3000, max: 8000 },
                comfort: 'premium',
                frequency: '1-2 daily',
                bestDepartureTime: '08:00'
            });
        }

        const transportOptions = route?.transportOptions?.length
            ? route.transportOptions
            : defaultOptions;

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
