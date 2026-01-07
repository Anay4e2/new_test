import { FC, useState } from 'react';
import { useTripStore, RouteSegment } from '../../stores/tripStore';
import { TrainSearch } from '../Transport/TrainSearch';

// Transport mode icons
const transportIcons: Record<string, string> = {
    road: '🚗',
    train: '🚂',
    flight: '✈️',
    bus: '🚌'
};

// Transport Card Component
const TransportCard: FC<{ segment: RouteSegment }> = ({ segment }) => {
    const [expanded, setExpanded] = useState(false);
    const suggested = segment.suggestedTransport;

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

            {/* Expand for more options */}
            {segment.transportOptions.length > 1 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 text-xs text-blue-400 hover:underline"
                >
                    {expanded ? 'Hide options' : `+${segment.transportOptions.length - 1} more options`}
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

                {/* Train Search - Always Available */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                        🚂 Search Indian Railways
                    </h3>
                    <TrainSearch />
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
                    </div>
                )}

                {/* Train Search Section */}
                {cities.length >= 2 && (
                    <div>
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                            🚂 Find Trains
                        </h3>
                        <TrainSearch
                            fromCity={cities[0]}
                            toCity={cities[1]}
                            autoSearch={false}
                        />
                    </div>
                )}

                {/* Train Search - Always Available */}
                {cities.length < 2 && (
                    <div>
                        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
                            🚂 Train Search
                        </h3>
                        <TrainSearch />
                    </div>
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
