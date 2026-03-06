import { Request, Response } from 'express';
import axios from 'axios';
import Place from '../models/Place';
import City from '../models/City';
import { PLACES } from '../services/mockData';
import logger from '../lib/logger';

// In-memory cache for Google Places photo URLs (place name -> photos)
const photoCache = new Map<string, { urls: string[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getAllPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
        let places = await Place.find();

        // If no places in DB, use mock data
        if (!places || places.length === 0) {
            logger.info('No places in DB, using mock data');
            res.json(PLACES);
            return;
        }

        res.json(places);
    } catch (error) {
        logger.error('Error fetching places, using mock data:', error);
        res.json(PLACES);
    }
};

export const getPlacesByState = async (req: Request, res: Response): Promise<void> => {
    try {
        const { stateCode } = req.params;

        // Get cities in this state
        const cities = await City.find({ stateCode });
        const cityNames = cities.map(c => c.name);

        // Get places in those cities
        const places = await Place.find({ cityName: { $in: cityNames } });
        res.json(places);
    } catch (error: any) {
        logger.error('Error fetching places by state:', error);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
};

/**
 * Fetch photos for a place from Google Places API (New).
 * Uses Text Search to find the place, then fetches photo URLs.
 * Falls back to existing mock data images if API key is missing or call fails.
 */
export const getPlacePhotos = async (req: Request, res: Response): Promise<void> => {
    try {
        const { placeName } = req.params;
        const city = typeof req.query.city === 'string' ? req.query.city : '';
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            // No API key — fall back to mock data images
            const mockPlace = PLACES.find(p => p._id === placeName || p.name === placeName);
            res.json({ photos: (mockPlace as any)?.images || [], source: 'mock' });
            return;
        }

        // Check cache
        const cacheKey = `${placeName}_${city}`.toLowerCase();
        const cached = photoCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            res.json({ photos: cached.urls, source: 'cache' });
            return;
        }

        // Step 1: Text Search to find the place and get photo references
        const searchQuery = city ? `${placeName}, ${city}, India` : `${placeName}, India`;
        const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';

        const searchResponse = await axios.post(textSearchUrl, {
            textQuery: searchQuery,
            languageCode: 'en',
            maxResultCount: 1,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
            },
            timeout: 8000,
        });

        const place = searchResponse.data?.places?.[0];
        if (!place?.photos || place.photos.length === 0) {
            const mockPlace = PLACES.find(p => p._id === placeName || p.name === placeName);
            res.json({ photos: (mockPlace as any)?.images || [], source: 'mock' });
            return;
        }

        // Step 2: Resolve photo URLs by following redirects to get public CDN URLs (up to 6 photos)
        const photoRefs = place.photos.slice(0, 6);
        const photoUrls = await Promise.all(
            photoRefs.map(async (photo: { name: string }) => {
                try {
                    const mediaUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=800&maxHeightPx=600&key=${apiKey}&skipHttpRedirect=true`;
                    const mediaRes = await axios.get(mediaUrl, { timeout: 5000 });
                    return mediaRes.data?.photoUri || null;
                } catch {
                    return null;
                }
            })
        );

        const validUrls = photoUrls.filter((url): url is string => !!url);

        // Cache the results
        photoCache.set(cacheKey, { urls: validUrls, timestamp: Date.now() });

        res.json({ photos: validUrls, source: 'google' });
    } catch (error: any) {
        logger.error('Error fetching place photos from Google:', error?.response?.data || error.message);
        const { placeName } = req.params;
        const mockPlace = PLACES.find(p => p._id === placeName || p.name === placeName);
        res.json({ photos: (mockPlace as any)?.images || [], source: 'mock' });
    }
};
