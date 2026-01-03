// Train API Service using RapidAPI IRCTC
// Uses the RapidAPI IRCTC API for live Indian Railway train data

import axios from 'axios';

// RapidAPI Configuration
const RAPIDAPI_KEY = '551491d80amsha4ae220a02402d9p179fd0jsna1a484b21945';
const RAPIDAPI_HOST = 'irctc1.p.rapidapi.com';
const BASE_URL = 'https://irctc1.p.rapidapi.com';

// Station codes for major cities
export const STATION_CODES: Record<string, string> = {
    'Delhi': 'NDLS',      // New Delhi
    'New Delhi': 'NDLS',
    'Mumbai': 'CSTM',      // Mumbai CST
    'Kolkata': 'HWH',      // Howrah
    'Chennai': 'MAS',      // Chennai Central
    'Bangalore': 'SBC',    // Bangalore City
    'Hyderabad': 'SC',     // Secunderabad
    'Jaipur': 'JP',        // Jaipur Junction
    'Ahmedabad': 'ADI',    // Ahmedabad Junction
    'Pune': 'PUNE',        // Pune Junction
    'Varanasi': 'BSB',     // Varanasi Junction
    'Agra': 'AGC',         // Agra Cantt
    'Lucknow': 'LKO',      // Lucknow
    'Chandigarh': 'CDG',   // Chandigarh
    'Amritsar': 'ASR',     // Amritsar Junction
    'Guwahati': 'GHY',     // Guwahati
    'Bhubaneswar': 'BBS',  // Bhubaneswar
    'Kochi': 'ERS',        // Ernakulam Junction
    'Madurai': 'MDU',      // Madurai Junction
    'Jodhpur': 'JU',       // Jodhpur Junction
    'Udaipur': 'UDZ',      // Udaipur City
    'Haridwar': 'HW',      // Haridwar Junction
    'Rishikesh': 'RKSH',   // Rishikesh
    'Shimla': 'SML',       // Shimla
    'Mysore': 'MYS',       // Mysore Junction
    'Patna': 'PNBE',       // Patna Junction
    'Jammu': 'JAT',        // Jammu Tawi
    'Srinagar': 'SRNR',    // Srinagar (if available)
    'Goa': 'MAO',          // Madgaon (Goa)
    'Darjeeling': 'DJ',    // Darjeeling
    'Gangtok': 'NJP',      // Nearest: New Jalpaiguri
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

// Create axios instance with RapidAPI headers
const rapidApiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
    },
    timeout: 10000,
});

// Train API Service Class
class TrainAPIService {

    // Get trains between two stations
    async getTrainsBetweenStations(fromStation: string, toStation: string, date?: string): Promise<TrainSearchResult> {
        const fromCode = STATION_CODES[fromStation] || fromStation;
        const toCode = STATION_CODES[toStation] || toStation;

        // Format date as YYYY-MM-DD if not provided, use tomorrow
        const journeyDate = date || this.getTomorrowDate();

        try {
            console.log(`Fetching trains from ${fromCode} to ${toCode} on ${journeyDate}...`);

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
            console.error('RapidAPI Error:', error.response?.data || error.message);
            console.log('Falling back to cached train data...');
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
            console.error('Live Station Error:', error.response?.data || error.message);
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
            console.error('PNR Status Error:', error.response?.data || error.message);
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
            console.error('Train Schedule Error:', error.response?.data || error.message);
            return null;
        }
    }

    // Get train live status
    async getTrainLiveStatus(trainNumber: string, date?: string): Promise<any> {
        try {
            const journeyDate = date || this.getTodayDate();

            const response = await rapidApiClient.get('/api/v1/liveTrainStatus', {
                params: {
                    trainNo: trainNumber,
                    startDay: '0', // 0 = today
                },
            });

            if (response.data && response.data.status) {
                return response.data.data;
            }

            return null;
        } catch (error: any) {
            console.error('Train Live Status Error:', error.response?.data || error.message);
            return null;
        }
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
            console.error('Search Station Error:', error.response?.data || error.message);
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
            console.error('Seat Availability Error:', error.response?.data || error.message);
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
            console.error('Fare Error:', error.response?.data || error.message);
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
            console.log(`Returning ${cachedTrains.length} cached trains for ${fromCode}-${toCode}`);
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
