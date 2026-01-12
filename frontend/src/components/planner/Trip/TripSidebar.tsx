import { FC, useState, useEffect } from 'react';
import { useTripStore, RouteSegment } from '../../../stores/tripStore';
import axios from 'axios';

// Train info interface
interface TrainInfo {
    trainNumber: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    classes: string[];
    fromStation: string;
    toStation: string;
}

interface TrainSearchResult {
    fromStation: string;
    toStation: string;
    fromCode: string;
    toCode: string;
    trains: TrainInfo[];
}

// Transport mode icons
const transportIcons: Record<string, string> = {
    road: '🚗',
    train: '🚂',
    flight: '✈️',
    bus: '🚌'
};

// Transport Card Component with Train Search
const TransportCard: FC<{ segment: RouteSegment }> = ({ segment }) => {
    const [expanded, setExpanded] = useState(false);
    const [showTrains, setShowTrains] = useState(false);
    const [trains, setTrains] = useState<TrainInfo[]>([]);
    const [stationInfo, setStationInfo] = useState<{ from: string; to: string } | null>(null);
    const [loadingTrains, setLoadingTrains] = useState(false);
    const [trainError, setTrainError] = useState<string | null>(null);
    const suggested = segment.suggestedTransport;

    const fetchTrains = async () => {
        setLoadingTrains(true);
        setTrainError(null);
        try {
            const res = await axios.get<TrainSearchResult>(`http://localhost:3001/api/trains/${encodeURIComponent(segment.from)}/${encodeURIComponent(segment.to)}`);
            if (res.data.trains && res.data.trains.length > 0) {
                setTrains(res.data.trains);
                setStationInfo({ from: `${res.data.fromStation} (${res.data.fromCode})`, to: `${res.data.toStation} (${res.data.toCode})` });
            } else {
                setTrainError(`No direct trains found between ${segment.from} and ${segment.to}`);
            }
        } catch (e) {
            setTrainError('Failed to fetch trains');
        } finally {
            setLoadingTrains(false);
        }
    };

    const handleShowTrains = () => {
        if (!showTrains && trains.length === 0) {
            fetchTrains();
        }
        setShowTrains(!showTrains);
    };

    return (
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{suggested ? transportIcons[suggested.mode] : '🚗'}</span>
                    <div>
                        <div className="text-sm font-medium text-white">
                            {segment.from} → {segment.to}
                        </div>
                        <div className="text-xs text-gray-400">
                            {segment.distance} km
                        </div>
                    </div>
                </div>
                {suggested && (
                    <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                            {suggested.duration.toFixed(1)} hrs
                        </div>
                        <div className="text-xs text-gray-400">
                            ₹{suggested.estimatedCost.min} - ₹{suggested.estimatedCost.max}
                        </div>
                    </div>
                )}
            </div>

            {/* Best departure time */}
            {suggested?.bestDepartureTime && (
                <div className="mt-2 text-xs text-accent flex items-center gap-1">
                    <span>⏰</span>
                    <span>Best departure: {suggested.bestDepartureTime}</span>
                </div>
            )}

            {/* Find Trains Button */}
            <button
                onClick={handleShowTrains}
                className="mt-3 w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
            >
                <span>🚂</span>
                {loadingTrains ? 'Finding trains...' : (showTrains ? 'Hide Trains' : 'Find Trains')}
            </button>

            {/* Train Results */}
            {showTrains && (
                <div className="mt-3 space-y-2">
                    {stationInfo && (
                        <div className="text-[10px] text-gray-500 bg-white/5 p-1.5 rounded">
                            📍 Nearest stations: {stationInfo.from} → {stationInfo.to}
                        </div>
                    )}
                    {trainError && (
                        <div className="text-xs text-orange-400 bg-orange-500/10 p-2 rounded">{trainError}</div>
                    )}
                    {trains.map((train, i) => (
                        <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-white">
                                        {train.trainNumber} - {train.trainName}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                        <span>🕒 {train.departureTime}</span>
                                        <span>→</span>
                                        <span>{train.arrivalTime}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-emerald-400">{train.duration}</div>
                                </div>
                            </div>
                            {train.classes && train.classes.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {train.classes.slice(0, 4).map((cls, j) => (
                                        <span key={j} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded">
                                            {cls}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Expand for more transport options */}
            {segment.transportOptions.length > 1 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs text-gray-400 hover:text-white"
                >
                    {expanded ? 'Hide other options' : `+${segment.transportOptions.length - 1} more transport options`}
                </button>
            )}

            {expanded && (
                <div className="mt-2 space-y-2">
                    {segment.transportOptions
                        .filter(opt => opt !== suggested)
                        .map((opt, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded text-xs">
                                <div className="flex items-center gap-2">
                                    <span>{transportIcons[opt.mode]}</span>
                                    <span className="capitalize">{opt.mode}</span>
                                </div>
                                <div className="text-right">
                                    <div>{opt.duration.toFixed(1)} hrs</div>
                                    <div className="text-gray-400">
                                        ₹{opt.estimatedCost.min} - ₹{opt.estimatedCost.max}
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export const TripSidebar: FC = () => {
    const {
        selectedPlaces,
        removePlace,
        clearAllPlaces,
        daysPerCity,
        setDaysForCity,
        getSelectedCities,
        optimizedRoute,
        routeSegments,
        totalDistance,
        estimatedTravelTime,
        isOptimizing,
        optimizeRoute,
        showRouteOnMap,
        setShowRouteOnMap
    } = useTripStore();

    const cities = getSelectedCities();

    if (selectedPlaces.length === 0) {
        return (
            <div className="h-full flex flex-col bg-neutral-900/95 backdrop-blur-lg overflow-hidden">
                {/* Empty state header */}
                <div className="p-6 text-center border-b border-white/10">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-xl font-bold text-white mb-2">Start Your Adventure</h3>
                    <p className="text-gray-400 text-sm">
                        Hover over states on the map and click the + button to add places to your trip.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-neutral-900/95 backdrop-blur-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white">Your Trip</h2>
                    <button
                        onClick={clearAllPlaces}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Clear All
                    </button>
                </div>
                <div className="flex gap-4 text-sm text-gray-400">
                    <span>📍 {selectedPlaces.length} places</span>
                    <span>🏙️ {cities.length} cities</span>
                    {totalDistance > 0 && <span>🛣️ {totalDistance} km</span>}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Selected Places */}
                <div>
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                        Selected Places
                    </h3>
                    <ul className="space-y-2">
                        {(optimizedRoute.length > 0 ? optimizedRoute : selectedPlaces).map((place, index) => (
                            <li
                                key={place._id}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                            >
                                {/* Order number */}
                                <span className="w-6 h-6 flex items-center justify-center bg-accent/20 text-accent text-xs font-bold rounded-full">
                                    {optimizedRoute.length > 0 ? (place as any).order : index + 1}
                                </span>

                                {/* Place info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white truncate">{place.name}</div>
                                    <div className="text-xs text-gray-400">{place.cityName}</div>
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={() => removePlace(place._id)}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <span className="text-red-400 text-sm">✕</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Days Configuration */}
                {cities.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                            Days Per City
                        </h3>
                        <div className="space-y-2">
                            {cities.map(city => (
                                <div key={city} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-white font-medium">{city}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDaysForCity(city, (daysPerCity[city] || 2) - 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white font-bold"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center text-white font-bold">
                                            {daysPerCity[city] || 2}
                                        </span>
                                        <button
                                            onClick={() => setDaysForCity(city, (daysPerCity[city] || 2) + 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Route Segments (Transport) */}
                {routeSegments.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                            Transport Suggestions
                        </h3>
                        <div className="space-y-2">
                            {routeSegments.map((segment, i) => (
                                <TransportCard key={i} segment={segment} />
                            ))}
                        </div>
                        {estimatedTravelTime > 0 && (
                            <div className="mt-3 p-3 bg-accent/10 rounded-lg text-center">
                                <div className="text-sm text-white">
                                    Total Travel Time: <strong className="text-accent">{estimatedTravelTime} hours</strong>
                                </div>
                            </div>
                        )}

                        {/* Google Maps Route Link */}
                        {(() => {
                            // Get unique cities from route segments
                            const routeCities = [routeSegments[0]?.from, ...routeSegments.map(s => s.to)].filter(Boolean);
                            if (routeCities.length < 2) return null;

                            const origin = encodeURIComponent(routeCities[0] + ', India');
                            const destination = encodeURIComponent(routeCities[routeCities.length - 1] + ', India');
                            const waypoints = routeCities.slice(1, -1).map(c => encodeURIComponent(c + ', India')).join('|');

                            const mapsUrl = waypoints
                                ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`
                                : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

                            return (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <span>🚗</span>
                                    Open Route in Google Maps
                                    <span className="text-xs opacity-75">↗</span>
                                </a>
                            );
                        })()}
                    </div>
                )}

                {/* Clothing Recommendations */}
                {selectedPlaces.length > 0 && (
                    <ClothingRecommendation cities={cities} />
                )}

                {/* Travel Mode Recommendations */}
                {totalDistance > 0 && (
                    <TravelModeRecommendation distance={totalDistance} />
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 space-y-3">
                {/* Show/Hide Route Toggle */}
                {optimizedRoute.length > 0 && (
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showRouteOnMap}
                            onChange={(e) => setShowRouteOnMap(e.target.checked)}
                            className="rounded"
                        />
                        Show route on map
                    </label>
                )}

                {/* Optimize Button */}
                <button
                    onClick={optimizeRoute}
                    disabled={isOptimizing || selectedPlaces.length < 2}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${isOptimizing
                        ? 'bg-gray-600 cursor-wait'
                        : selectedPlaces.length < 2
                            ? 'bg-gray-700 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg hover:shadow-emerald-500/30'
                        }`}
                >
                    {isOptimizing ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Optimizing...
                        </span>
                    ) : optimizedRoute.length > 0 ? (
                        '🔄 Re-optimize Route'
                    ) : (
                        '✨ Optimize Route'
                    )}
                </button>

                {selectedPlaces.length < 2 && (
                    <p className="text-xs text-gray-400 text-center">
                        Add at least 2 places to optimize your route
                    </p>
                )}
            </div>
        </div>
    );
};

// Clothing Recommendation Component with Weather API (using Open-Meteo - free, no API key needed)
const ClothingRecommendation: FC<{ cities: string[] }> = ({ cities }) => {
    const [weather, setWeather] = useState<{ temp: number; description: string; humidity: number } | null>(null);
    const [loading, setLoading] = useState(false);

    const currentMonth = new Date().getMonth();

    // Weather code to description mapping
    const getWeatherDescription = (code: number): string => {
        if (code === 0) return 'Clear sky';
        if (code <= 3) return 'Partly cloudy';
        if (code <= 48) return 'Foggy';
        if (code <= 57) return 'Drizzle';
        if (code <= 67) return 'Rain';
        if (code <= 77) return 'Snow';
        if (code <= 82) return 'Rain showers';
        if (code <= 86) return 'Snow showers';
        if (code >= 95) return 'Thunderstorm';
        return 'Cloudy';
    };

    // Fetch weather using Open-Meteo (free API, no key required)
    useEffect(() => {
        const fetchWeather = async () => {
            if (cities.length === 0) return;

            setLoading(true);
            try {
                // First, get coordinates using Google Geocoding (uses existing Maps API key)
                const geocoder = new google.maps.Geocoder();
                const city = cities[0];

                geocoder.geocode({ address: `${city}, India` }, async (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        const lat = results[0].geometry.location.lat();
                        const lng = results[0].geometry.location.lng();

                        // Fetch weather from Open-Meteo (free, no API key)
                        const res = await fetch(
                            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code`
                        );

                        if (res.ok) {
                            const data = await res.json();
                            setWeather({
                                temp: Math.round(data.current.temperature_2m),
                                description: getWeatherDescription(data.current.weather_code),
                                humidity: data.current.relative_humidity_2m
                            });
                        }
                    }
                    setLoading(false);
                });
            } catch (error) {
                console.error('Weather fetch failed:', error);
                setLoading(false);
            }
        };

        // Only fetch if Google Maps is loaded
        if (typeof google !== 'undefined' && google.maps) {
            fetchWeather();
        }
    }, [cities]);

    // Determine season
    const getSeason = () => {
        if (currentMonth >= 2 && currentMonth <= 4) return 'summer';
        if (currentMonth >= 5 && currentMonth <= 8) return 'monsoon';
        if (currentMonth >= 9 && currentMonth <= 10) return 'autumn';
        return 'winter';
    };

    // Get temperature-based or season-based recommendations
    const getRecommendations = () => {
        const recommendations: { icon: string; item: string; tip?: string }[] = [];
        const temp = weather?.temp;
        const season = getSeason();

        // Temperature-based recommendations (if weather available)
        if (temp !== undefined) {
            if (temp <= 10) {
                recommendations.push({ icon: '🧥', item: 'Heavy Jacket/Coat', tip: `Current temp: ${temp}°C` });
                recommendations.push({ icon: '🧣', item: 'Scarf & Gloves' });
                recommendations.push({ icon: '🧶', item: 'Woolen Clothes' });
            } else if (temp <= 20) {
                recommendations.push({ icon: '🧥', item: 'Light Jacket', tip: `Current temp: ${temp}°C` });
                recommendations.push({ icon: '👕', item: 'Full-sleeve Shirts' });
            } else if (temp <= 30) {
                recommendations.push({ icon: '👕', item: 'Cotton T-shirts', tip: `Current temp: ${temp}°C` });
                recommendations.push({ icon: '👖', item: 'Light Trousers' });
            } else {
                recommendations.push({ icon: '👕', item: 'Loose Cotton Clothes', tip: `Hot! ${temp}°C` });
                recommendations.push({ icon: '🧢', item: 'Hat/Cap' });
                recommendations.push({ icon: '🕶️', item: 'Sunglasses' });
            }
        } else {
            // Fallback to season-based
            if (season === 'winter') {
                recommendations.push({ icon: '🧥', item: 'Jacket/Sweater' });
            } else if (season === 'summer') {
                recommendations.push({ icon: '👕', item: 'Cotton Clothes' });
            } else if (season === 'monsoon') {
                recommendations.push({ icon: '☔', item: 'Rain Jacket/Umbrella' });
            }
        }

        // Universal items
        recommendations.push({ icon: '👟', item: 'Comfortable Walking Shoes' });

        return recommendations;
    };

    const recommendations = getRecommendations();
    const weatherIcon = weather ? (weather.temp > 30 ? '🌡️' : weather.temp < 15 ? '❄️' : '🌤️') : '🌡️';

    return (
        <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                👔 What to Pack
            </h3>
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/20">
                {loading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                        <span className="text-sm">Fetching weather...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{weatherIcon}</span>
                            <div>
                                {weather ? (
                                    <>
                                        <div className="text-sm font-medium text-white">{weather.temp}°C - {weather.description}</div>
                                        <div className="text-xs text-gray-400">Humidity: {weather.humidity}%</div>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-400">Weather data unavailable</div>
                                )}
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {recommendations.slice(0, 5).map((rec, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-lg">{rec.icon}</span>
                                    <div className="flex-1">
                                        <span className="text-sm text-white">{rec.item}</span>
                                        {rec.tip && <p className="text-xs text-gray-400">{rec.tip}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
};

// Travel Mode Recommendation Component
const TravelModeRecommendation: FC<{ distance: number }> = ({ distance }) => {
    if (distance === 0) return null;

    // Calculate costs for different modes
    const getModeRecommendations = () => {
        const modes: { icon: string; mode: string; cost: string; duration: string; recommended?: boolean }[] = [];

        if (distance < 100) {
            // Short distance - Road preferred
            modes.push({
                icon: '🚗',
                mode: 'Self Drive',
                cost: `₹${Math.round(distance * 12)}-₹${Math.round(distance * 15)}`,
                duration: `${(distance / 50).toFixed(1)} hrs`,
                recommended: true
            });
            modes.push({
                icon: '🚕',
                mode: 'Taxi/Cab',
                cost: `₹${Math.round(distance * 18)}-₹${Math.round(distance * 25)}`,
                duration: `${(distance / 40).toFixed(1)} hrs`
            });
        } else if (distance < 500) {
            // Medium distance - Train preferred
            modes.push({
                icon: '🚂',
                mode: 'Train (AC)',
                cost: `₹${Math.round(distance * 2)}-₹${Math.round(distance * 3.5)}`,
                duration: `${(distance / 60).toFixed(1)} hrs`,
                recommended: true
            });
            modes.push({
                icon: '🚌',
                mode: 'Bus (Volvo)',
                cost: `₹${Math.round(distance * 1.5)}-₹${Math.round(distance * 2.5)}`,
                duration: `${(distance / 45).toFixed(1)} hrs`
            });
            modes.push({
                icon: '🚗',
                mode: 'Self Drive',
                cost: `₹${Math.round(distance * 10)}-₹${Math.round(distance * 14)}`,
                duration: `${(distance / 50).toFixed(1)} hrs`
            });
        } else {
            // Long distance - Flight an option
            modes.push({
                icon: '✈️',
                mode: 'Flight',
                cost: `₹${4000 + Math.round(distance * 4)}-₹${8000 + Math.round(distance * 6)}`,
                duration: `${(distance / 700 + 2).toFixed(1)} hrs`,
                recommended: distance > 800
            });
            modes.push({
                icon: '🚂',
                mode: 'Train (AC)',
                cost: `₹${Math.round(distance * 1.5)}-₹${Math.round(distance * 3)}`,
                duration: `${(distance / 55).toFixed(1)} hrs`,
                recommended: distance <= 800
            });
            modes.push({
                icon: '🚌',
                mode: 'Bus (Sleeper)',
                cost: `₹${Math.round(distance * 1)}-₹${Math.round(distance * 2)}`,
                duration: `${(distance / 40).toFixed(1)} hrs`
            });
        }

        return modes;
    };

    const modes = getModeRecommendations();

    return (
        <div>
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                🚀 Recommended Travel Modes
            </h3>
            <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-lg p-4 border border-green-500/20">
                <div className="text-xs text-gray-400 mb-3">Total Distance: {distance} km</div>
                <div className="space-y-2">
                    {modes.map((m, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-between p-2 rounded-lg ${m.recommended ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{m.icon}</span>
                                <div>
                                    <div className="text-sm text-white flex items-center gap-2">
                                        {m.mode}
                                        {m.recommended && (
                                            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                                                BEST
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">{m.duration}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium text-emerald-400">{m.cost}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
