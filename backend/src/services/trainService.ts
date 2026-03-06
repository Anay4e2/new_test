import logger from '../lib/logger';
// Train API Service using RapidAPI IRCTC
// Uses the RapidAPI IRCTC API for live Indian Railway train data

import axios from 'axios';

// RapidAPI Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'irctc1.p.rapidapi.com';
const BASE_URL = 'https://irctc1.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
    logger.warn('RAPIDAPI_KEY not set — train API calls will use mock data');
}

// Station codes for major cities (mapping city/location to nearest railway station)
export const STATION_CODES: Record<string, string> = {
    // Metro Cities
    'Delhi': 'NDLS',      // New Delhi
    'New Delhi': 'NDLS',
    'Mumbai': 'CSTM',      // Mumbai CST
    'Kolkata': 'HWH',      // Howrah
    'Chennai': 'MAS',      // Chennai Central
    'Bangalore': 'SBC',    // Bangalore City
    'Hyderabad': 'SC',     // Secunderabad

    // Rajasthan (Tourist destinations with nearest stations)
    'Jaipur': 'JP',        // Jaipur Junction
    'Jodhpur': 'JU',       // Jodhpur Junction
    'Udaipur': 'UDZ',      // Udaipur City
    'Jaisalmer': 'JSM',    // Jaisalmer
    'Bikaner': 'BKN',      // Bikaner Junction
    'Ajmer': 'AII',        // Ajmer Junction
    'Pushkar': 'AII',      // Nearest: Ajmer Junction (11km away)
    'Mount Abu': 'ABR',    // Abu Road
    'Chittorgarh': 'COR',  // Chittorgarh
    'Sawai Madhopur': 'SWM', // Sawai Madhopur (for Ranthambore)
    'Ranthambore': 'SWM',  // Nearest: Sawai Madhopur
    'Bharatpur': 'BTE',    // Bharatpur Junction
    'Alwar': 'AWR',        // Alwar Junction

    // North India
    'Agra': 'AGC',         // Agra Cantt
    'Lucknow': 'LKO',      // Lucknow
    'Varanasi': 'BSB',     // Varanasi Junction
    'Ahmedabad': 'ADI',    // Ahmedabad Junction
    'Pune': 'PUNE',        // Pune Junction
    'Chandigarh': 'CDG',   // Chandigarh
    'Amritsar': 'ASR',     // Amritsar Junction
    'Haridwar': 'HW',      // Haridwar Junction
    'Rishikesh': 'RKSH',   // Rishikesh
    'Dehradun': 'DDN',     // Dehradun
    'Shimla': 'SML',       // Shimla (narrow gauge)
    'Manali': 'CDG',       // Nearest: Chandigarh (310km)
    'Dharamshala': 'PTKC', // Pathankot Cantt (nearest)
    'Jammu': 'JAT',        // Jammu Tawi

    // South India
    'Kochi': 'ERS',        // Ernakulam Junction
    'Madurai': 'MDU',      // Madurai Junction
    'Mysore': 'MYS',       // Mysore Junction
    'Ooty': 'MTP',         // Mettupalayam (nearest, then toy train)
    'Coimbatore': 'CBE',   // Coimbatore Junction
    'Trivandrum': 'TVC',   // Trivandrum Central
    'Mangalore': 'MAQ',    // Mangalore Junction

    // East India
    'Guwahati': 'GHY',     // Guwahati
    'Bhubaneswar': 'BBS',  // Bhubaneswar
    'Patna': 'PNBE',       // Patna Junction
    'Darjeeling': 'NJP',   // Nearest: New Jalpaiguri
    'Gangtok': 'NJP',      // Nearest: New Jalpaiguri
    'Puri': 'PURI',        // Puri

    // West India
    'Goa': 'MAO',          // Madgaon (Goa)
    'Panaji': 'KRMI',      // Karmali (nearest to Panaji)
    'Surat': 'ST',         // Surat
    'Vadodara': 'BRC',     // Vadodara Junction
    'Indore': 'INDB',      // Indore Junction
    'Bhopal': 'BPL',       // Bhopal Junction
    'Ujjain': 'UJN',       // Ujjain Junction
    'Khajuraho': 'KURJ',   // Khajuraho
};

// Cached train data for popular routes (fallback when API is unavailable)
const CACHED_TRAINS: Record<string, TrainInfo[]> = {
    'NDLS-CSTM': [ // Delhi to Mumbai
        { trainNumber: '12951', trainName: 'Mumbai Rajdhani', departureTime: '16:55', arrivalTime: '08:35', duration: '15h 40m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A'], fromStation: 'New Delhi', toStation: 'Mumbai Central', source: 'cached' },
        { trainNumber: '12953', trainName: 'August Kranti Rajdhani', departureTime: '17:40', arrivalTime: '10:55', duration: '17h 15m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A'], fromStation: 'H Nizamuddin', toStation: 'Mumbai Central', source: 'cached' },
        { trainNumber: '12909', trainName: 'Gujarat Sampark Kranti', departureTime: '10:10', arrivalTime: '06:00', duration: '19h 50m', daysOfOperation: ['Mon', 'Wed', 'Fri'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Ahmedabad', source: 'cached' },
        { trainNumber: '22209', trainName: 'Mumbai Duronto', departureTime: '23:00', arrivalTime: '15:45', duration: '16h 45m', daysOfOperation: ['Tue', 'Fri', 'Sun'], classes: ['2A', '3A'], fromStation: 'New Delhi', toStation: 'Mumbai Central', source: 'cached' },
    ],
    'NDLS-HWH': [ // Delhi to Kolkata
        { trainNumber: '12301', trainName: 'Howrah Rajdhani', departureTime: '16:50', arrivalTime: '09:55', duration: '17h 05m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A'], fromStation: 'New Delhi', toStation: 'Howrah', source: 'cached' },
        { trainNumber: '12303', trainName: 'Poorva Express', departureTime: '16:45', arrivalTime: '19:15', duration: '26h 30m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Howrah', source: 'cached' },
        { trainNumber: '22311', trainName: 'Howrah Duronto', departureTime: '19:20', arrivalTime: '11:30', duration: '16h 10m', daysOfOperation: ['Mon', 'Wed', 'Sat'], classes: ['2A', '3A'], fromStation: 'New Delhi', toStation: 'Howrah', source: 'cached' },
    ],
    'NDLS-MAS': [ // Delhi to Chennai
        { trainNumber: '12621', trainName: 'Tamil Nadu Express', departureTime: '22:30', arrivalTime: '07:10', duration: '32h 40m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Chennai Central', source: 'cached' },
        { trainNumber: '12433', trainName: 'Chennai Rajdhani', departureTime: '15:55', arrivalTime: '20:10', duration: '28h 15m', daysOfOperation: ['Mon', 'Wed', 'Fri'], classes: ['1A', '2A', '3A'], fromStation: 'H Nizamuddin', toStation: 'Chennai Central', source: 'cached' },
    ],
    'NDLS-SBC': [ // Delhi to Bangalore
        { trainNumber: '12627', trainName: 'Karnataka Express', departureTime: '21:20', arrivalTime: '06:10', duration: '32h 50m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Bangalore City', source: 'cached' },
        { trainNumber: '22691', trainName: 'Bangalore Rajdhani', departureTime: '20:50', arrivalTime: '05:40', duration: '32h 50m', daysOfOperation: ['Mon', 'Tue', 'Thu', 'Sat'], classes: ['1A', '2A', '3A'], fromStation: 'H Nizamuddin', toStation: 'Bangalore City', source: 'cached' },
    ],
    'NDLS-JP': [ // Delhi to Jaipur
        { trainNumber: '12015', trainName: 'Ajmer Shatabdi', departureTime: '06:05', arrivalTime: '10:40', duration: '4h 35m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], fromStation: 'New Delhi', toStation: 'Jaipur', source: 'cached' },
        { trainNumber: '12957', trainName: 'Swarna Jayanti Express', departureTime: '20:55', arrivalTime: '05:45', duration: '8h 50m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Ahmedabad', source: 'cached' },
        { trainNumber: '12985', trainName: 'Double Decker', departureTime: '13:30', arrivalTime: '18:05', duration: '4h 35m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC'], fromStation: 'New Delhi', toStation: 'Jaipur', source: 'cached' },
    ],
    'CSTM-MAS': [ // Mumbai to Chennai
        { trainNumber: '12163', trainName: 'Chennai Express', departureTime: '20:05', arrivalTime: '19:15', duration: '23h 10m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'Mumbai CST', toStation: 'Chennai Central', source: 'cached' },
    ],
    'CSTM-SBC': [ // Mumbai to Bangalore
        { trainNumber: '12677', trainName: 'Ernakulam Express', departureTime: '15:10', arrivalTime: '15:30', duration: '24h 20m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'Mumbai CST', toStation: 'Bangalore City', source: 'cached' },
    ],
    'HWH-GHY': [ // Kolkata to Guwahati
        { trainNumber: '12345', trainName: 'Saraighat Express', departureTime: '15:50', arrivalTime: '06:30', duration: '14h 40m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A'], fromStation: 'Howrah', toStation: 'Guwahati', source: 'cached' },
        { trainNumber: '12423', trainName: 'Rajdhani Express', departureTime: '17:15', arrivalTime: '05:30', duration: '12h 15m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'], classes: ['1A', '2A', '3A'], fromStation: 'Howrah', toStation: 'Guwahati', source: 'cached' },
    ],
    'NDLS-ADI': [ // Delhi to Ahmedabad
        { trainNumber: '12957', trainName: 'Swarna Jayanti Express', departureTime: '20:55', arrivalTime: '05:50', duration: '8h 55m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Ahmedabad', source: 'cached' },
        { trainNumber: '12915', trainName: 'Ashram Express', departureTime: '15:20', arrivalTime: '06:15', duration: '14h 55m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Ahmedabad', source: 'cached' },
    ],
    'NDLS-BSB': [ // Delhi to Varanasi
        { trainNumber: '12559', trainName: 'Shiv Ganga Express', departureTime: '18:55', arrivalTime: '06:40', duration: '11h 45m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Varanasi', source: 'cached' },
        { trainNumber: '22435', trainName: 'Vande Bharat Express', departureTime: '06:00', arrivalTime: '14:00', duration: '8h 00m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], fromStation: 'New Delhi', toStation: 'Varanasi', source: 'cached' },
    ],
    'NDLS-LKO': [ // Delhi to Lucknow
        { trainNumber: '12003', trainName: 'Lucknow Shatabdi', departureTime: '06:10', arrivalTime: '12:30', duration: '6h 20m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['CC', 'EC'], fromStation: 'New Delhi', toStation: 'Lucknow', source: 'cached' },
        { trainNumber: '12229', trainName: 'Lucknow Mail', departureTime: '22:30', arrivalTime: '07:05', duration: '8h 35m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Lucknow', source: 'cached' },
    ],
    'NDLS-SC': [ // Delhi to Hyderabad
        { trainNumber: '12723', trainName: 'Telangana Express', departureTime: '06:25', arrivalTime: '05:30', duration: '23h 05m', daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], classes: ['SL', '3A', '2A', '1A'], fromStation: 'New Delhi', toStation: 'Secunderabad', source: 'cached' },
    ],
};

export interface TrainInfo {
    trainNumber: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    daysOfOperation: string[];
    classes: string[];
    fromStation: string;
    toStation: string;
    source: 'api' | 'cached';
}

export interface TrainSearchResult {
    fromStation: string;
    toStation: string;
    fromCode: string;
    toCode: string;
    trains: TrainInfo[];
    totalTrains: number;
    lastUpdated: string;
    source: 'rapidapi' | 'cached';
}

export interface LiveStationTrain {
    trainNumber: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
    delayMinutes: number;
    platform: string;
    status: string;
}

export interface UpcomingStop {
    station: string;
    stationCode: string;
    scheduledArrival: string;
    expectedArrival: string;
    scheduledDeparture: string;
    platform?: number;
    haltTime?: string;
    distanceFromSource?: number;
    arrived: boolean;
}

export interface TrainStatus {
    trainNumber: string;
    trainName: string;
    currentStation: string;
    delay: number; // minutes
    lastUpdated: string;
    status: 'on-time' | 'delayed' | 'cancelled' | 'not-started' | 'unavailable';
    upcomingStops: UpcomingStop[];
    source: 'api' | 'fallback';
}

// Create axios instance with RapidAPI headers
const rapidApiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
    },
    timeout: 10000,
});

// In-memory cache for live train status (5-minute TTL)
const STATUS_CACHE_TTL_MS = 5 * 60 * 1000;
const statusCache = new Map<string, { data: TrainStatus; timestamp: number }>();

// Train API Service Class
class TrainAPIService {

    // Get trains between two stations
    async getTrainsBetweenStations(fromStation: string, toStation: string, date?: string): Promise<TrainSearchResult> {
        const fromCode = STATION_CODES[fromStation] || fromStation;
        const toCode = STATION_CODES[toStation] || toStation;

        // Format date as YYYY-MM-DD if not provided, use tomorrow
        const journeyDate = date || this.getTomorrowDate();

        try {
            logger.info(`Fetching trains from ${fromCode} to ${toCode} on ${journeyDate}...`);

            const response = await rapidApiClient.get('/api/v3/trainBetweenStations', {
                params: {
                    fromStationCode: fromCode,
                    toStationCode: toCode,
                    dateOfJourney: journeyDate,
                },
            });

            if (response.data && response.data.status && response.data.data) {
                const trains: TrainInfo[] = response.data.data.map((train: any) => ({
                    trainNumber: train.train_number || train.trainNumber || '',
                    trainName: train.train_name || train.trainName || '',
                    departureTime: train.from_sta || train.departureTime || '',
                    arrivalTime: train.to_sta || train.arrivalTime || '',
                    duration: train.duration || this.calculateDuration(train.from_sta, train.to_sta),
                    daysOfOperation: train.run_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    classes: train.class_type || train.classes || ['SL', '3A', '2A'],
                    fromStation: train.from_station_name || fromStation,
                    toStation: train.to_station_name || toStation,
                    source: 'api' as const,
                }));

                return {
                    fromStation,
                    toStation,
                    fromCode,
                    toCode,
                    trains,
                    totalTrains: trains.length,
                    lastUpdated: new Date().toISOString(),
                    source: 'rapidapi',
                };
            }

            // API returned no data, try cached
            return this.getCachedResult(fromStation, toStation, fromCode, toCode);
        } catch (error: any) {
            logger.error('RapidAPI Error:', error.response?.data || error.message);
            logger.info('Falling back to cached train data...');
            // Return cached data on error
            return this.getCachedResult(fromStation, toStation, fromCode, toCode);
        }
    }

    // Get live trains at a station
    async getLiveStation(stationCode: string, hours: number = 2): Promise<LiveStationTrain[]> {
        try {
            const response = await rapidApiClient.get('/api/v3/getLiveStation', {
                params: {
                    stationCode,
                    hours: hours.toString(),
                },
            });

            if (response.data && response.data.status && response.data.data) {
                return response.data.data.map((train: any) => ({
                    trainNumber: train.train_number || '',
                    trainName: train.train_name || '',
                    departureTime: train.std || train.departure_time || '',
                    arrivalTime: train.sta || train.arrival_time || '',
                    delayMinutes: train.delay || 0,
                    platform: train.platform || 'N/A',
                    status: train.status || 'On Time',
                }));
            }

            return [];
        } catch (error: any) {
            logger.error('Live Station Error:', error.response?.data || error.message);
            return [];
        }
    }

    // Check PNR status
    async checkPNRStatus(pnrNumber: string): Promise<any> {
        try {
            const response = await rapidApiClient.get('/api/v3/getPNRStatus', {
                params: { pnrNumber },
            });

            if (response.data && response.data.status) {
                return response.data.data;
            }

            return null;
        } catch (error: any) {
            logger.error('PNR Status Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get train schedule
    async getTrainSchedule(trainNumber: string): Promise<any> {
        try {
            const response = await rapidApiClient.get('/api/v1/getTrainSchedule', {
                params: { trainNo: trainNumber },
            });

            if (response.data && response.data.status) {
                return response.data.data;
            }

            return null;
        } catch (error: any) {
            logger.error('Train Schedule Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get train live status with caching
    async getTrainLiveStatus(trainNumber: string, date?: string): Promise<TrainStatus> {
        const journeyDate = date || this.getTodayDate();
        const cacheKey = `${trainNumber}-${journeyDate}`;

        // Check cache
        const cached = statusCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < STATUS_CACHE_TTL_MS) {
            return cached.data;
        }

        try {
            // Calculate startDay: 0 = today, 1 = yesterday started, etc.
            const today = new Date();
            const target = new Date(journeyDate);
            const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
            const startDay = Math.max(0, Math.min(diffDays, 4)).toString();

            const response = await rapidApiClient.get('/api/v1/liveTrainStatus', {
                params: {
                    trainNo: trainNumber,
                    startDay,
                },
            });

            if (response.data && response.data.status && response.data.data) {
                const raw = response.data.data;
                const result = this.mapToTrainStatus(raw, trainNumber);
                statusCache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            }

            return this.getUnavailableStatus(trainNumber);
        } catch (error: any) {
            logger.error('Train Live Status Error:', error.response?.data || error.message);
            return this.getUnavailableStatus(trainNumber);
        }
    }

    // Map raw API response to structured TrainStatus
    private mapToTrainStatus(raw: any, trainNumber: string): TrainStatus {
        const currentStation = raw.current_station_name || raw.current_station || 'Unknown';
        const delayMinutes = parseInt(raw.delay || raw.late_min || '0', 10) || 0;
        const trainName = raw.train_name || `Train ${trainNumber}`;

        let status: TrainStatus['status'] = 'on-time';
        if (raw.status === 'cancelled' || raw.train_status === 'Cancelled') {
            status = 'cancelled';
        } else if (raw.not_started || raw.train_status === 'Not Started') {
            status = 'not-started';
        } else if (delayMinutes > 0) {
            status = 'delayed';
        }

        const upcomingStops: UpcomingStop[] = (raw.upcoming_stations || raw.route || []).map((stop: any) => ({
            station: stop.station_name || stop.stationName || '',
            stationCode: stop.station_code || stop.stationCode || '',
            scheduledArrival: stop.sta || stop.scheduled_arrival || '',
            expectedArrival: stop.eta || stop.expected_arrival || stop.sta || '',
            scheduledDeparture: stop.std || stop.scheduled_departure || '',
            platform: stop.platform ? parseInt(stop.platform, 10) : undefined,
            haltTime: stop.halt || stop.halt_time || undefined,
            distanceFromSource: stop.distance ? parseInt(stop.distance, 10) : undefined,
            arrived: stop.has_arrived === true || stop.arrived === true,
        }));

        return {
            trainNumber,
            trainName,
            currentStation,
            delay: delayMinutes,
            lastUpdated: new Date().toISOString(),
            status,
            upcomingStops,
            source: 'api',
        };
    }

    // Fallback when API is unavailable
    private getUnavailableStatus(trainNumber: string): TrainStatus {
        return {
            trainNumber,
            trainName: `Train ${trainNumber}`,
            currentStation: 'Unknown',
            delay: 0,
            lastUpdated: new Date().toISOString(),
            status: 'unavailable',
            upcomingStops: [],
            source: 'fallback',
        };
    }

    // Search for station codes
    async searchStation(stationName: string): Promise<any[]> {
        try {
            const response = await rapidApiClient.get('/api/v1/searchStation', {
                params: { query: stationName },
            });

            if (response.data && response.data.status && response.data.data) {
                return response.data.data;
            }

            return [];
        } catch (error: any) {
            logger.error('Search Station Error:', error.response?.data || error.message);
            return [];
        }
    }

    // Check seat availability
    async checkSeatAvailability(
        trainNumber: string,
        fromStation: string,
        toStation: string,
        classType: string,
        date: string,
        quota: string = 'GN'
    ): Promise<any> {
        try {
            const response = await rapidApiClient.get('/api/v1/checkSeatAvailability', {
                params: {
                    trainNo: trainNumber,
                    fromStationCode: STATION_CODES[fromStation] || fromStation,
                    toStationCode: STATION_CODES[toStation] || toStation,
                    classType: classType, // SL, 3A, 2A, 1A, CC, EC
                    date: date,
                    quota: quota, // GN-General, TQ-Tatkal, PT-Premium Tatkal
                },
            });

            if (response.data && response.data.status) {
                return response.data.data;
            }

            return null;
        } catch (error: any) {
            logger.error('Seat Availability Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get fare details
    async getFare(trainNumber: string, fromStation: string, toStation: string): Promise<any> {
        try {
            const response = await rapidApiClient.get('/api/v2/getFare', {
                params: {
                    trainNo: trainNumber,
                    fromStationCode: STATION_CODES[fromStation] || fromStation,
                    toStationCode: STATION_CODES[toStation] || toStation,
                },
            });

            if (response.data && response.data.status) {
                return response.data.data;
            }

            return null;
        } catch (error: any) {
            logger.error('Fare Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get all station codes
    getStationCodes(): Record<string, string> {
        return STATION_CODES;
    }

    // Helper: Get tomorrow's date in YYYY-MM-DD format
    private getTomorrowDate(): string {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // Helper: Get today's date in YYYY-MM-DD format
    private getTodayDate(): string {
        return new Date().toISOString().split('T')[0];
    }

    // Helper: Calculate duration from departure and arrival times
    private calculateDuration(departure: string, arrival: string): string {
        if (!departure || !arrival) return 'N/A';

        try {
            const [depHours, depMins] = departure.split(':').map(Number);
            const [arrHours, arrMins] = arrival.split(':').map(Number);

            let durationMins = (arrHours * 60 + arrMins) - (depHours * 60 + depMins);
            if (durationMins < 0) durationMins += 24 * 60; // Next day arrival

            const hours = Math.floor(durationMins / 60);
            const mins = durationMins % 60;

            return `${hours}h ${mins}m`;
        } catch {
            return 'N/A';
        }
    }

    // Helper: Get cached result for popular routes
    private getCachedResult(fromStation: string, toStation: string, fromCode: string, toCode: string): TrainSearchResult {
        // Try both directions
        const routeKey = `${fromCode}-${toCode}`;
        const reverseRouteKey = `${toCode}-${fromCode}`;

        let cachedTrains = CACHED_TRAINS[routeKey];

        // If not found, try reverse route with swapped stations
        if (!cachedTrains) {
            cachedTrains = CACHED_TRAINS[reverseRouteKey];
            if (cachedTrains) {
                // Swap from/to stations for reverse route
                cachedTrains = cachedTrains.map(train => ({
                    ...train,
                    fromStation: train.toStation,
                    toStation: train.fromStation,
                }));
            }
        }

        if (cachedTrains && cachedTrains.length > 0) {
            logger.info(`Returning ${cachedTrains.length} cached trains for ${fromCode}-${toCode}`);
            return {
                fromStation,
                toStation,
                fromCode,
                toCode,
                trains: cachedTrains,
                totalTrains: cachedTrains.length,
                lastUpdated: new Date().toISOString(),
                source: 'cached',
            };
        }

        return this.getEmptyResult(fromStation, toStation, fromCode, toCode);
    }

    // Helper: Get empty result
    private getEmptyResult(fromStation: string, toStation: string, fromCode: string, toCode: string): TrainSearchResult {
        return {
            fromStation,
            toStation,
            fromCode,
            toCode,
            trains: [],
            totalTrains: 0,
            lastUpdated: new Date().toISOString(),
            source: 'cached',
        };
    }
}

export const trainService = new TrainAPIService();
export default trainService;
