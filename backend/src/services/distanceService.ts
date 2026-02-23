// Distance API Service
// Uses RapidAPI Distances for road distances with Haversine fallback

import axios from 'axios';

// RapidAPI Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'distances1.p.rapidapi.com';
const BASE_URL = 'https://distances1.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
    console.warn('RAPIDAPI_KEY not set — distance API calls will use Haversine fallback only');
}

export interface DistanceResult {
    straightLineDistance: number; // km (Haversine)
    roadDistance: number | null;  // km (API - actual road distance)
    distanceUsed: number;         // The value to use
    source: 'api' | 'haversine';
    unit: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

// Create axios instance with RapidAPI headers
const rapidApiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Calculate distance using Haversine formula (straight-line)
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

// Distance Service Class
class DistanceService {
    private cache: Map<string, DistanceResult> = new Map();

    // Get cache key for two coordinates
    private getCacheKey(from: Coordinates, to: Coordinates): string {
        return `${from.lat.toFixed(4)},${from.lng.toFixed(4)}-${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
    }

    // Get distance between two coordinates
    async getDistance(from: Coordinates, to: Coordinates, useApi: boolean = true): Promise<DistanceResult> {
        // Check cache first
        const cacheKey = this.getCacheKey(from, to);
        const reverseCacheKey = this.getCacheKey(to, from);

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }
        if (this.cache.has(reverseCacheKey)) {
            return this.cache.get(reverseCacheKey)!;
        }

        // Calculate Haversine distance (always available)
        const straightLineDistance = haversineDistance(from.lat, from.lng, to.lat, to.lng);

        let roadDistance: number | null = null;
        let source: 'api' | 'haversine' = 'haversine';

        // Try to get road distance from API if requested
        if (useApi) {
            try {
                const response = await rapidApiClient.post('/distance', {
                    lat1: from.lat.toString(),
                    lon1: from.lng.toString(),
                    lat2: to.lat.toString(),
                    lon2: to.lng.toString(),
                });

                if (response.data && response.data.distance) {
                    // API returns distance in km
                    roadDistance = parseFloat(response.data.distance);
                    source = 'api';
                }
            } catch (error: any) {
                console.log('Distance API fallback to Haversine:', error.message);
            }
        }

        const result: DistanceResult = {
            straightLineDistance: Math.round(straightLineDistance * 10) / 10,
            roadDistance: roadDistance ? Math.round(roadDistance * 10) / 10 : null,
            distanceUsed: roadDistance || Math.round(straightLineDistance * 1.3), // 1.3x factor for road estimate
            source,
            unit: 'km',
        };

        // Cache the result
        this.cache.set(cacheKey, result);

        return result;
    }

    // Get distances between multiple points (matrix style)
    async getDistanceMatrix(
        points: Coordinates[]
    ): Promise<number[][]> {
        const n = points.length;
        const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const result = await this.getDistance(points[i], points[j], false); // Use Haversine for matrix (faster)
                matrix[i][j] = result.distanceUsed;
                matrix[j][i] = result.distanceUsed; // Symmetric
            }
        }

        return matrix;
    }

    // Quick distance calculation (no API, just Haversine with road factor)
    getQuickDistance(from: Coordinates, to: Coordinates): number {
        const straightLine = haversineDistance(from.lat, from.lng, to.lat, to.lng);
        // Multiply by 1.3 to estimate road distance (typical road:straight ratio)
        return Math.round(straightLine * 1.3);
    }

    // Get driving time estimate in hours
    getDrivingTime(distanceKm: number, avgSpeedKmh: number = 50): number {
        return Math.round((distanceKm / avgSpeedKmh) * 10) / 10;
    }

    // Clear cache
    clearCache(): void {
        this.cache.clear();
    }
}

export const distanceService = new DistanceService();
export default distanceService;
