// Weather Service: seasonal lookup + optional OpenWeatherMap integration
import axios from 'axios';

export interface WeatherInfo {
    temp: number;       // °C
    humidity: number;   // %
    condition: string;  // e.g. "Clear", "Rain", "Haze"
    icon: string;       // OpenWeatherMap icon code (e.g. "01d", "09d")
    advisory?: string;
}

// ── Coordinates for Rajasthan cities (used for API calls) ───────────────────
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
 * Get seasonal (historical average) weather for a Rajasthan city + month.
 */
export const getSeasonalWeather = (cityName: string, month: number): WeatherInfo => {
    const key = cityName.toLowerCase().trim();
    const data = SEASONAL_DATA[key];

    if (!data || month < 1 || month > 12) {
        // Fallback: generic Rajasthan averages
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
