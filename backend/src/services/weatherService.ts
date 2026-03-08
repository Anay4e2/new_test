// Weather Service: seasonal lookup + optional OpenWeatherMap integration
import axios from 'axios';

export interface WeatherInfo {
    temp: number;       // °C
    humidity: number;   // %
    condition: string;  // e.g. "Clear", "Rain", "Haze"
    icon: string;       // OpenWeatherMap icon code (e.g. "01d", "09d")
    advisory?: string;
}

// ── Coordinates for cities (used for API calls) ────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    jaipur: { lat: 26.9124, lng: 75.7873 },
    jodhpur: { lat: 26.2389, lng: 73.0243 },
    udaipur: { lat: 24.5854, lng: 73.7125 },
    jaisalmer: { lat: 26.9157, lng: 70.9083 },
    pushkar: { lat: 26.4898, lng: 74.5511 },
    'mount abu': { lat: 24.5926, lng: 72.7156 },
    bikaner: { lat: 28.0229, lng: 73.3119 },
    ajmer: { lat: 26.4499, lng: 74.6399 },
    chittorgarh: { lat: 24.8887, lng: 74.6269 },
    // — Himachal Pradesh —
    shimla: { lat: 31.1048, lng: 77.1734 },
    manali: { lat: 32.2396, lng: 77.1887 },
    dharamshala: { lat: 32.219, lng: 76.3234 },
    // — Uttarakhand —
    rishikesh: { lat: 30.0869, lng: 78.2676 },
    haridwar: { lat: 29.9457, lng: 78.1642 },
    nainital: { lat: 29.3803, lng: 79.4636 },
    // — Delhi —
    delhi: { lat: 28.6139, lng: 77.209 },
    // — Uttar Pradesh —
    agra: { lat: 27.1767, lng: 78.0081 },
    varanasi: { lat: 25.3176, lng: 82.9739 },
    lucknow: { lat: 26.8467, lng: 80.9462 },
    mathura: { lat: 27.4924, lng: 77.6737 },
    // — Gujarat —
    ahmedabad: { lat: 23.0225, lng: 72.5714 },
    kutch: { lat: 23.7337, lng: 69.8597 },
    dwarka: { lat: 22.2442, lng: 68.9685 },
    somnath: { lat: 20.888, lng: 70.4013 },
    kevadia: { lat: 21.8381, lng: 73.7191 },
    // — Maharashtra —
    mumbai: { lat: 19.076, lng: 72.8777 },
    aurangabad: { lat: 19.8762, lng: 75.3433 },
    // — Goa —
    'north goa': { lat: 15.5501, lng: 73.8251 },
    'old goa': { lat: 15.5029, lng: 73.9116 },
    // — Kerala —
    kochi: { lat: 9.9312, lng: 76.2673 },
    munnar: { lat: 10.0889, lng: 77.0595 },
    alleppey: { lat: 9.4981, lng: 76.3388 },
    // — Karnataka —
    bangalore: { lat: 12.9716, lng: 77.5946 },
    mysore: { lat: 12.3052, lng: 76.6552 },
    hampi: { lat: 15.335, lng: 76.46 },
    // — Tamil Nadu —
    chennai: { lat: 13.0827, lng: 80.2707 },
    madurai: { lat: 9.9252, lng: 78.1198 },
    // — West Bengal —
    kolkata: { lat: 22.5726, lng: 88.3639 },
    // — Madhya Pradesh —
    bhopal: { lat: 23.2599, lng: 77.4126 },
    khajuraho: { lat: 24.8318, lng: 79.9199 },
    ujjain: { lat: 23.1765, lng: 75.7885 },
    orchha: { lat: 25.3519, lng: 78.6419 },
    // — Telangana —
    hyderabad: { lat: 17.385, lng: 78.4867 },
    // — Punjab —
    amritsar: { lat: 31.634, lng: 74.8723 },
    // — Chandigarh —
    chandigarh: { lat: 30.7333, lng: 76.7794 },
    // — Odisha —
    puri: { lat: 19.8135, lng: 85.8312 },
    bhubaneswar: { lat: 20.2961, lng: 85.8245 },
};

// ── Seasonal lookup table: average monthly weather per city ─────────────────
// months 1-12, each entry: { temp, humidity, condition, icon }
interface MonthlyWeather {
    temp: number;
    humidity: number;
    condition: string;
    icon: string;
}

const SEASONAL_DATA: Record<string, MonthlyWeather[]> = {
    jaipur: [
        { temp: 15, humidity: 40, condition: 'Clear', icon: '01d' }, // Jan
        { temp: 18, humidity: 35, condition: 'Clear', icon: '01d' }, // Feb
        { temp: 25, humidity: 25, condition: 'Clear', icon: '01d' }, // Mar
        { temp: 33, humidity: 20, condition: 'Haze', icon: '50d' }, // Apr
        { temp: 39, humidity: 18, condition: 'Hot & Dry', icon: '01d' }, // May
        { temp: 42, humidity: 30, condition: 'Extreme Heat', icon: '01d' }, // Jun
        { temp: 34, humidity: 70, condition: 'Rain', icon: '10d' }, // Jul
        { temp: 32, humidity: 75, condition: 'Rain', icon: '09d' }, // Aug
        { temp: 33, humidity: 60, condition: 'Partly Cloudy', icon: '02d' }, // Sep
        { temp: 30, humidity: 35, condition: 'Clear', icon: '01d' }, // Oct
        { temp: 23, humidity: 30, condition: 'Clear', icon: '01d' }, // Nov
        { temp: 17, humidity: 38, condition: 'Clear', icon: '01d' }, // Dec
    ],
    jodhpur: [
        { temp: 17, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 20, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 18, condition: 'Haze', icon: '50d' },
        { temp: 40, humidity: 15, condition: 'Hot & Dry', icon: '01d' },
        { temp: 43, humidity: 28, condition: 'Extreme Heat', icon: '01d' },
        { temp: 35, humidity: 65, condition: 'Rain', icon: '10d' },
        { temp: 33, humidity: 70, condition: 'Rain', icon: '09d' },
        { temp: 34, humidity: 50, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 32, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 33, condition: 'Clear', icon: '01d' },
    ],
    udaipur: [
        { temp: 16, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 32, humidity: 18, condition: 'Haze', icon: '50d' },
        { temp: 37, humidity: 16, condition: 'Hot & Dry', icon: '01d' },
        { temp: 38, humidity: 35, condition: 'Hot & Humid', icon: '50d' },
        { temp: 30, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 28, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 38, condition: 'Clear', icon: '01d' },
    ],
    jaisalmer: [
        { temp: 16, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 18, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 14, condition: 'Hot & Dry', icon: '01d' },
        { temp: 41, humidity: 12, condition: 'Extreme Heat', icon: '01d' },
        { temp: 44, humidity: 22, condition: 'Extreme Heat', icon: '01d' },
        { temp: 37, humidity: 55, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 35, humidity: 60, condition: 'Light Rain', icon: '10d' },
        { temp: 35, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 33, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 28, condition: 'Clear', icon: '01d' },
    ],
    pushkar: [
        { temp: 15, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 33, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 23, condition: 'Clear', icon: '01d' },
        { temp: 33, humidity: 18, condition: 'Haze', icon: '50d' },
        { temp: 39, humidity: 16, condition: 'Hot & Dry', icon: '01d' },
        { temp: 41, humidity: 30, condition: 'Extreme Heat', icon: '01d' },
        { temp: 33, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 76, condition: 'Rain', icon: '09d' },
        { temp: 32, humidity: 58, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 33, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 37, condition: 'Clear', icon: '01d' },
    ],
    'mount abu': [
        { temp: 12, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 14, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 20, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 20, condition: 'Hot & Dry', icon: '01d' },
        { temp: 30, humidity: 45, condition: 'Humid', icon: '02d' },
        { temp: 24, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 22, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 24, humidity: 70, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 22, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 13, humidity: 42, condition: 'Clear', icon: '01d' },
    ],
    bikaner: [
        { temp: 14, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 20, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 15, condition: 'Haze', icon: '50d' },
        { temp: 40, humidity: 14, condition: 'Extreme Heat', icon: '01d' },
        { temp: 43, humidity: 25, condition: 'Extreme Heat', icon: '01d' },
        { temp: 36, humidity: 58, condition: 'Rain', icon: '10d' },
        { temp: 34, humidity: 65, condition: 'Rain', icon: '09d' },
        { temp: 34, humidity: 45, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 32, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 35, condition: 'Clear', icon: '01d' },
    ],
    ajmer: [
        { temp: 15, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 33, humidity: 20, condition: 'Haze', icon: '50d' },
        { temp: 39, humidity: 17, condition: 'Hot & Dry', icon: '01d' },
        { temp: 41, humidity: 32, condition: 'Extreme Heat', icon: '01d' },
        { temp: 33, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 76, condition: 'Rain', icon: '09d' },
        { temp: 32, humidity: 58, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 40, condition: 'Clear', icon: '01d' },
    ],
    chittorgarh: [
        { temp: 16, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 33, humidity: 18, condition: 'Haze', icon: '50d' },
        { temp: 38, humidity: 16, condition: 'Hot & Dry', icon: '01d' },
        { temp: 40, humidity: 35, condition: 'Extreme Heat', icon: '01d' },
        { temp: 31, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 30, humidity: 62, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 29, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 33, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 38, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Himachal Pradesh
    // ═══════════════════════════════════════════════════════════════════════
    shimla: [
        { temp: 4, humidity: 60, condition: 'Snow', icon: '13d' },   // Jan
        { temp: 6, humidity: 55, condition: 'Snow', icon: '13d' },   // Feb
        { temp: 11, humidity: 45, condition: 'Clear', icon: '01d' }, // Mar
        { temp: 16, humidity: 35, condition: 'Clear', icon: '01d' }, // Apr
        { temp: 20, humidity: 40, condition: 'Partly Cloudy', icon: '02d' }, // May
        { temp: 22, humidity: 65, condition: 'Rain', icon: '10d' }, // Jun
        { temp: 18, humidity: 88, condition: 'Heavy Rain', icon: '09d' }, // Jul
        { temp: 17, humidity: 90, condition: 'Heavy Rain', icon: '09d' }, // Aug
        { temp: 16, humidity: 72, condition: 'Rain', icon: '10d' }, // Sep
        { temp: 13, humidity: 45, condition: 'Clear', icon: '01d' }, // Oct
        { temp: 9, humidity: 40, condition: 'Clear', icon: '01d' },  // Nov
        { temp: 5, humidity: 55, condition: 'Snow', icon: '13d' },   // Dec
    ],
    manali: [
        { temp: 1, humidity: 65, condition: 'Snow', icon: '13d' },
        { temp: 3, humidity: 60, condition: 'Snow', icon: '13d' },
        { temp: 9, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 14, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 42, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 22, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 18, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 17, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 15, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 12, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 7, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 2, humidity: 60, condition: 'Snow', icon: '13d' },
    ],
    dharamshala: [
        { temp: 5, humidity: 58, condition: 'Clear', icon: '01d' },
        { temp: 7, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 13, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 40, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 24, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 20, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 19, humidity: 93, condition: 'Heavy Rain', icon: '09d' },
        { temp: 18, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 15, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 10, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 6, humidity: 55, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Uttarakhand
    // ═══════════════════════════════════════════════════════════════════════
    rishikesh: [
        { temp: 14, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 28, condition: 'Haze', icon: '50d' },
        { temp: 36, humidity: 25, condition: 'Hot & Dry', icon: '01d' },
        { temp: 35, humidity: 55, condition: 'Humid', icon: '02d' },
        { temp: 30, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 25, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 15, humidity: 52, condition: 'Clear', icon: '01d' },
    ],
    haridwar: [
        { temp: 13, humidity: 58, condition: 'Clear', icon: '01d' },
        { temp: 16, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 30, condition: 'Haze', icon: '50d' },
        { temp: 36, humidity: 28, condition: 'Hot & Dry', icon: '01d' },
        { temp: 35, humidity: 58, condition: 'Humid', icon: '02d' },
        { temp: 30, humidity: 83, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 86, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 25, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 14, humidity: 55, condition: 'Clear', icon: '01d' },
    ],
    nainital: [
        { temp: 5, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 7, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 12, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 38, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 22, humidity: 65, condition: 'Rain', icon: '10d' },
        { temp: 18, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 17, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 16, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 14, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 10, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 6, humidity: 50, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Delhi
    // ═══════════════════════════════════════════════════════════════════════
    delhi: [
        { temp: 14, humidity: 55, condition: 'Haze', icon: '50d' },
        { temp: 17, humidity: 48, condition: 'Haze', icon: '50d' },
        { temp: 24, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 33, humidity: 22, condition: 'Haze', icon: '50d' },
        { temp: 40, humidity: 20, condition: 'Extreme Heat', icon: '01d' },
        { temp: 42, humidity: 35, condition: 'Extreme Heat', icon: '01d' },
        { temp: 35, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 33, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 33, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 29, humidity: 40, condition: 'Haze', icon: '50d' },
        { temp: 22, humidity: 45, condition: 'Haze', icon: '50d' },
        { temp: 15, humidity: 55, condition: 'Haze', icon: '50d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Uttar Pradesh
    // ═══════════════════════════════════════════════════════════════════════
    agra: [
        { temp: 14, humidity: 55, condition: 'Haze', icon: '50d' },
        { temp: 17, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 20, condition: 'Haze', icon: '50d' },
        { temp: 40, humidity: 18, condition: 'Extreme Heat', icon: '01d' },
        { temp: 42, humidity: 35, condition: 'Extreme Heat', icon: '01d' },
        { temp: 34, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 32, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 32, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 28, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 40, condition: 'Haze', icon: '50d' },
        { temp: 15, humidity: 52, condition: 'Haze', icon: '50d' },
    ],
    varanasi: [
        { temp: 15, humidity: 60, condition: 'Haze', icon: '50d' },
        { temp: 18, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 22, condition: 'Hot & Dry', icon: '01d' },
        { temp: 40, humidity: 20, condition: 'Extreme Heat', icon: '01d' },
        { temp: 40, humidity: 45, condition: 'Hot & Humid', icon: '50d' },
        { temp: 33, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 32, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 32, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 48, condition: 'Haze', icon: '50d' },
        { temp: 16, humidity: 58, condition: 'Haze', icon: '50d' },
    ],
    lucknow: [
        { temp: 14, humidity: 58, condition: 'Haze', icon: '50d' },
        { temp: 17, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 20, condition: 'Hot & Dry', icon: '01d' },
        { temp: 40, humidity: 18, condition: 'Extreme Heat', icon: '01d' },
        { temp: 39, humidity: 45, condition: 'Hot & Humid', icon: '50d' },
        { temp: 33, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 32, humidity: 84, condition: 'Heavy Rain', icon: '09d' },
        { temp: 32, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 45, condition: 'Haze', icon: '50d' },
        { temp: 15, humidity: 55, condition: 'Haze', icon: '50d' },
    ],
    mathura: [
        { temp: 14, humidity: 55, condition: 'Haze', icon: '50d' },
        { temp: 17, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 20, condition: 'Haze', icon: '50d' },
        { temp: 40, humidity: 18, condition: 'Extreme Heat', icon: '01d' },
        { temp: 42, humidity: 32, condition: 'Extreme Heat', icon: '01d' },
        { temp: 34, humidity: 76, condition: 'Rain', icon: '10d' },
        { temp: 32, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 32, humidity: 62, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 28, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 42, condition: 'Haze', icon: '50d' },
        { temp: 15, humidity: 52, condition: 'Haze', icon: '50d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Gujarat
    // ═══════════════════════════════════════════════════════════════════════
    ahmedabad: [
        { temp: 20, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 29, humidity: 20, condition: 'Clear', icon: '01d' },
        { temp: 35, humidity: 18, condition: 'Hot & Dry', icon: '01d' },
        { temp: 39, humidity: 22, condition: 'Extreme Heat', icon: '01d' },
        { temp: 37, humidity: 55, condition: 'Hot & Humid', icon: '50d' },
        { temp: 32, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 30, humidity: 80, condition: 'Rain', icon: '09d' },
        { temp: 31, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 32, condition: 'Clear', icon: '01d' },
    ],
    kutch: [
        { temp: 18, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 18, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 16, condition: 'Hot & Dry', icon: '01d' },
        { temp: 38, humidity: 20, condition: 'Extreme Heat', icon: '01d' },
        { temp: 37, humidity: 50, condition: 'Hot & Humid', icon: '50d' },
        { temp: 32, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 30, humidity: 75, condition: 'Rain', icon: '09d' },
        { temp: 31, humidity: 58, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 30, condition: 'Clear', icon: '01d' },
    ],
    dwarka: [
        { temp: 20, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 50, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 32, humidity: 60, condition: 'Humid', icon: '02d' },
        { temp: 32, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 48, condition: 'Clear', icon: '01d' },
    ],
    somnath: [
        { temp: 21, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 31, humidity: 48, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 33, humidity: 58, condition: 'Humid', icon: '02d' },
        { temp: 32, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 46, condition: 'Clear', icon: '01d' },
    ],
    kevadia: [
        { temp: 20, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 22, condition: 'Hot & Dry', icon: '01d' },
        { temp: 37, humidity: 28, condition: 'Hot & Dry', icon: '01d' },
        { temp: 34, humidity: 65, condition: 'Humid', icon: '02d' },
        { temp: 29, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 36, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Maharashtra
    // ═══════════════════════════════════════════════════════════════════════
    mumbai: [
        { temp: 25, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 29, humidity: 48, condition: 'Haze', icon: '50d' },
        { temp: 32, humidity: 55, condition: 'Humid', icon: '02d' },
        { temp: 33, humidity: 62, condition: 'Humid', icon: '02d' },
        { temp: 31, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 82, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 52, condition: 'Clear', icon: '01d' },
    ],
    aurangabad: [
        { temp: 20, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 34, humidity: 18, condition: 'Hot & Dry', icon: '01d' },
        { temp: 38, humidity: 20, condition: 'Extreme Heat', icon: '01d' },
        { temp: 34, humidity: 55, condition: 'Humid', icon: '02d' },
        { temp: 28, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 27, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 38, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Goa
    // ═══════════════════════════════════════════════════════════════════════
    'north goa': [
        { temp: 26, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 32, humidity: 58, condition: 'Humid', icon: '02d' },
        { temp: 33, humidity: 65, condition: 'Humid', icon: '02d' },
        { temp: 30, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 62, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 52, condition: 'Clear', icon: '01d' },
    ],
    'old goa': [
        { temp: 26, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 32, humidity: 58, condition: 'Humid', icon: '02d' },
        { temp: 33, humidity: 65, condition: 'Humid', icon: '02d' },
        { temp: 30, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 62, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 52, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Kerala
    // ═══════════════════════════════════════════════════════════════════════
    kochi: [
        { temp: 27, humidity: 65, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 62, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 31, humidity: 72, condition: 'Humid', icon: '02d' },
        { temp: 30, humidity: 80, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 26, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 26, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 27, humidity: 85, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 72, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 27, humidity: 68, condition: 'Clear', icon: '01d' },
    ],
    munnar: [
        { temp: 15, humidity: 60, condition: 'Clear', icon: '01d' },
        { temp: 16, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 52, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 20, humidity: 60, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 20, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 17, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 16, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 16, humidity: 90, condition: 'Heavy Rain', icon: '09d' },
        { temp: 17, humidity: 82, condition: 'Rain', icon: '10d' },
        { temp: 18, humidity: 72, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 17, humidity: 65, condition: 'Clear', icon: '01d' },
        { temp: 15, humidity: 62, condition: 'Clear', icon: '01d' },
    ],
    alleppey: [
        { temp: 27, humidity: 68, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 65, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 68, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 31, humidity: 74, condition: 'Humid', icon: '02d' },
        { temp: 30, humidity: 82, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 26, humidity: 93, condition: 'Heavy Rain', icon: '09d' },
        { temp: 26, humidity: 92, condition: 'Heavy Rain', icon: '09d' },
        { temp: 27, humidity: 86, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 80, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 74, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 27, humidity: 70, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Karnataka
    // ═══════════════════════════════════════════════════════════════════════
    bangalore: [
        { temp: 22, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 31, humidity: 35, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 50, condition: 'Rain', icon: '10d' },
        { temp: 25, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 24, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 23, humidity: 80, condition: 'Rain', icon: '09d' },
        { temp: 24, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 24, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 22, humidity: 62, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 21, humidity: 50, condition: 'Clear', icon: '01d' },
    ],
    mysore: [
        { temp: 22, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 30, condition: 'Clear', icon: '01d' },
        { temp: 31, humidity: 35, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 30, humidity: 52, condition: 'Rain', icon: '10d' },
        { temp: 25, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 24, humidity: 76, condition: 'Rain', icon: '10d' },
        { temp: 23, humidity: 78, condition: 'Rain', icon: '09d' },
        { temp: 24, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 24, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 22, humidity: 60, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 21, humidity: 48, condition: 'Clear', icon: '01d' },
    ],
    hampi: [
        { temp: 24, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 32, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 36, humidity: 20, condition: 'Hot & Dry', icon: '01d' },
        { temp: 38, humidity: 28, condition: 'Hot & Dry', icon: '01d' },
        { temp: 32, humidity: 55, condition: 'Humid', icon: '02d' },
        { temp: 28, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 75, condition: 'Rain', icon: '09d' },
        { temp: 28, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 48, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 25, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 38, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Tamil Nadu
    // ═══════════════════════════════════════════════════════════════════════
    chennai: [
        { temp: 25, humidity: 65, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 58, condition: 'Clear', icon: '01d' },
        { temp: 29, humidity: 55, condition: 'Haze', icon: '50d' },
        { temp: 33, humidity: 55, condition: 'Hot & Humid', icon: '50d' },
        { temp: 37, humidity: 50, condition: 'Extreme Heat', icon: '01d' },
        { temp: 37, humidity: 48, condition: 'Hot & Dry', icon: '01d' },
        { temp: 35, humidity: 55, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 34, humidity: 60, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 33, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 30, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 25, humidity: 72, condition: 'Rain', icon: '10d' },
    ],
    madurai: [
        { temp: 25, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 33, humidity: 45, condition: 'Hot & Humid', icon: '50d' },
        { temp: 36, humidity: 42, condition: 'Hot & Dry', icon: '01d' },
        { temp: 35, humidity: 40, condition: 'Hot & Dry', icon: '01d' },
        { temp: 34, humidity: 45, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 33, humidity: 50, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 32, humidity: 58, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 25, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // West Bengal
    // ═══════════════════════════════════════════════════════════════════════
    kolkata: [
        { temp: 19, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 42, condition: 'Haze', icon: '50d' },
        { temp: 33, humidity: 50, condition: 'Hot & Humid', icon: '50d' },
        { temp: 35, humidity: 60, condition: 'Hot & Humid', icon: '50d' },
        { temp: 33, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 31, humidity: 86, condition: 'Heavy Rain', icon: '09d' },
        { temp: 31, humidity: 80, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 70, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 25, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 20, humidity: 52, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Madhya Pradesh
    // ═══════════════════════════════════════════════════════════════════════
    bhopal: [
        { temp: 17, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 20, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 35, humidity: 18, condition: 'Hot & Dry', icon: '01d' },
        { temp: 40, humidity: 16, condition: 'Extreme Heat', icon: '01d' },
        { temp: 38, humidity: 45, condition: 'Hot & Humid', icon: '50d' },
        { temp: 29, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 42, condition: 'Clear', icon: '01d' },
    ],
    khajuraho: [
        { temp: 16, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 26, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 35, humidity: 18, condition: 'Hot & Dry', icon: '01d' },
        { temp: 41, humidity: 16, condition: 'Extreme Heat', icon: '01d' },
        { temp: 39, humidity: 42, condition: 'Hot & Humid', icon: '50d' },
        { temp: 30, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 84, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 45, condition: 'Clear', icon: '01d' },
    ],
    ujjain: [
        { temp: 18, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 21, humidity: 32, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 22, condition: 'Clear', icon: '01d' },
        { temp: 36, humidity: 18, condition: 'Hot & Dry', icon: '01d' },
        { temp: 40, humidity: 16, condition: 'Extreme Heat', icon: '01d' },
        { temp: 37, humidity: 48, condition: 'Hot & Humid', icon: '50d' },
        { temp: 29, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 27, humidity: 84, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 68, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 33, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 40, condition: 'Clear', icon: '01d' },
    ],
    orchha: [
        { temp: 16, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 27, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 36, humidity: 18, condition: 'Hot & Dry', icon: '01d' },
        { temp: 42, humidity: 16, condition: 'Extreme Heat', icon: '01d' },
        { temp: 39, humidity: 45, condition: 'Hot & Humid', icon: '50d' },
        { temp: 30, humidity: 82, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 70, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 35, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 45, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Telangana
    // ═══════════════════════════════════════════════════════════════════════
    hyderabad: [
        { temp: 22, humidity: 48, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 30, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 35, humidity: 25, condition: 'Hot & Dry', icon: '01d' },
        { temp: 38, humidity: 30, condition: 'Hot & Dry', icon: '01d' },
        { temp: 32, humidity: 62, condition: 'Rain', icon: '10d' },
        { temp: 28, humidity: 78, condition: 'Heavy Rain', icon: '09d' },
        { temp: 27, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 28, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 27, humidity: 60, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 24, humidity: 50, condition: 'Clear', icon: '01d' },
        { temp: 22, humidity: 48, condition: 'Clear', icon: '01d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Punjab
    // ═══════════════════════════════════════════════════════════════════════
    amritsar: [
        { temp: 8, humidity: 65, condition: 'Haze', icon: '50d' },
        { temp: 12, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 19, humidity: 40, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 28, condition: 'Clear', icon: '01d' },
        { temp: 35, humidity: 22, condition: 'Hot & Dry', icon: '01d' },
        { temp: 38, humidity: 38, condition: 'Hot & Humid', icon: '50d' },
        { temp: 33, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 32, humidity: 78, condition: 'Heavy Rain', icon: '09d' },
        { temp: 31, humidity: 62, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 25, humidity: 45, condition: 'Clear', icon: '01d' },
        { temp: 17, humidity: 55, condition: 'Haze', icon: '50d' },
        { temp: 10, humidity: 65, condition: 'Haze', icon: '50d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Chandigarh
    // ═══════════════════════════════════════════════════════════════════════
    chandigarh: [
        { temp: 9, humidity: 60, condition: 'Haze', icon: '50d' },
        { temp: 13, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 20, humidity: 38, condition: 'Clear', icon: '01d' },
        { temp: 29, humidity: 25, condition: 'Clear', icon: '01d' },
        { temp: 35, humidity: 22, condition: 'Hot & Dry', icon: '01d' },
        { temp: 37, humidity: 42, condition: 'Hot & Humid', icon: '50d' },
        { temp: 32, humidity: 75, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 80, condition: 'Heavy Rain', icon: '09d' },
        { temp: 30, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 26, humidity: 42, condition: 'Clear', icon: '01d' },
        { temp: 18, humidity: 48, condition: 'Haze', icon: '50d' },
        { temp: 11, humidity: 58, condition: 'Haze', icon: '50d' },
    ],

    // ═══════════════════════════════════════════════════════════════════════
    // Odisha
    // ═══════════════════════════════════════════════════════════════════════
    puri: [
        { temp: 23, humidity: 65, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 62, condition: 'Clear', icon: '01d' },
        { temp: 28, humidity: 68, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 31, humidity: 72, condition: 'Humid', icon: '02d' },
        { temp: 33, humidity: 75, condition: 'Humid', icon: '02d' },
        { temp: 32, humidity: 82, condition: 'Rain', icon: '10d' },
        { temp: 30, humidity: 88, condition: 'Heavy Rain', icon: '09d' },
        { temp: 29, humidity: 86, condition: 'Heavy Rain', icon: '09d' },
        { temp: 30, humidity: 80, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 72, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 26, humidity: 65, condition: 'Clear', icon: '01d' },
        { temp: 24, humidity: 62, condition: 'Clear', icon: '01d' },
    ],
    bhubaneswar: [
        { temp: 22, humidity: 60, condition: 'Clear', icon: '01d' },
        { temp: 25, humidity: 52, condition: 'Clear', icon: '01d' },
        { temp: 29, humidity: 48, condition: 'Haze', icon: '50d' },
        { temp: 34, humidity: 50, condition: 'Hot & Humid', icon: '50d' },
        { temp: 37, humidity: 55, condition: 'Hot & Humid', icon: '50d' },
        { temp: 34, humidity: 72, condition: 'Rain', icon: '10d' },
        { temp: 31, humidity: 85, condition: 'Heavy Rain', icon: '09d' },
        { temp: 30, humidity: 84, condition: 'Heavy Rain', icon: '09d' },
        { temp: 30, humidity: 78, condition: 'Rain', icon: '10d' },
        { temp: 29, humidity: 65, condition: 'Partly Cloudy', icon: '02d' },
        { temp: 26, humidity: 55, condition: 'Clear', icon: '01d' },
        { temp: 23, humidity: 58, condition: 'Clear', icon: '01d' },
    ],
};

// ── Advisory generator ──────────────────────────────────────────────────────
function generateAdvisory(temp: number, month: number, condition: string): string | undefined {
    if (temp >= 42) {
        return 'Extreme heat expected (>42°C) — avoid outdoor activities between 12–4 PM. Stay hydrated and carry sunscreen.';
    }
    if (temp >= 38) {
        return 'Very hot weather — limit outdoor sightseeing to mornings and evenings. Carry water and sun protection.';
    }
    if (month >= 7 && month <= 9 && condition.toLowerCase().includes('rain')) {
        return 'Monsoon season — carry rain gear, some roads may be inaccessible. Check local conditions before traveling.';
    }
    if (month >= 7 && month <= 9) {
        return 'Monsoon season — occasional rain expected. Carry an umbrella and waterproof bags.';
    }
    if (temp <= 3) {
        return 'Very cold / sub-zero possible — pack heavy woolens, thermals, and snow gear. Roads may be icy.';
    }
    if (temp <= 8) {
        return 'Cold weather — carry warm clothing, especially for early morning and evening activities.';
    }
    if (temp >= 15 && temp <= 30 && !condition.toLowerCase().includes('rain')) {
        return 'Pleasant weather — ideal for sightseeing and outdoor activities!';
    }
    return undefined;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Get seasonal (historical average) weather for an Indian city + month.
 */
export const getSeasonalWeather = (cityName: string, month: number): WeatherInfo => {
    const key = cityName.toLowerCase().trim();
    const data = SEASONAL_DATA[key];

    if (!data || month < 1 || month > 12) {
        // Fallback: generic India averages
        const fallback: MonthlyWeather = { temp: 28, humidity: 40, condition: 'Clear', icon: '01d' };
        return {
            ...fallback,
            advisory: generateAdvisory(fallback.temp, month, fallback.condition),
        };
    }

    const entry = data[month - 1]; // 0-indexed array
    return {
        ...entry,
        advisory: generateAdvisory(entry.temp, month, entry.condition),
    };
};

/**
 * Get weather forecast for a specific location + date.
 * Uses OpenWeatherMap if API key is available, otherwise falls back to seasonal data.
 */
export const getWeatherForecast = async (
    lat: number,
    lng: number,
    date: string,
    cityName?: string
): Promise<WeatherInfo> => {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (apiKey) {
        try {
            const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
                params: {
                    lat,
                    lon: lng,
                    appid: apiKey,
                    units: 'metric',
                    cnt: 40, // 5-day forecast max for free tier
                },
            });

            const targetDate = new Date(date).toISOString().split('T')[0];
            // Find the forecast entry closest to the target date (noon)
            const forecasts = response.data.list as any[];
            const match = forecasts.find((f: any) => {
                const fDate = new Date(f.dt * 1000).toISOString().split('T')[0];
                return fDate === targetDate;
            }) || forecasts[0];

            if (match) {
                const temp = Math.round(match.main.temp);
                const month = new Date(date).getMonth() + 1;
                const condition = match.weather[0]?.main || 'Clear';
                return {
                    temp,
                    humidity: match.main.humidity,
                    condition,
                    icon: match.weather[0]?.icon || '01d',
                    advisory: generateAdvisory(temp, month, condition),
                };
            }
        } catch (error) {
            // Fall through to seasonal data
        }
    }

    // Fallback: use seasonal data
    const month = new Date(date).getMonth() + 1;
    const city = cityName || findCityByCoords(lat, lng);
    return getSeasonalWeather(city, month);
};

/**
 * Look up city name from coordinates (rough match).
 */
function findCityByCoords(lat: number, lng: number): string {
    let closest = 'jaipur';
    let minDist = Infinity;

    for (const [name, coords] of Object.entries(CITY_COORDS)) {
        const dist = Math.abs(coords.lat - lat) + Math.abs(coords.lng - lng);
        if (dist < minDist) {
            minDist = dist;
            closest = name;
        }
    }

    return closest;
}

/**
 * Get coordinates for a city name (for API calls).
 */
export const getCityCoordinates = (cityName: string): { lat: number; lng: number } | null => {
    return CITY_COORDS[cityName.toLowerCase().trim()] || null;
};
