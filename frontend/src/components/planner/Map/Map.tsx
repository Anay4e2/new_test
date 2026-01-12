import { FC, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { useTripStore } from '../../../stores/tripStore';

// --- Dark Map Style ---
const darkMapStyle: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
    { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
];

// --- Miniature Icons for Place Types ---
const getPlaceEmoji = (type?: string): string => {
    switch (type) {
        case 'Temple': return '🛕';
        case 'Beach': return '🏖️';
        case 'Palace': return '🏰';
        case 'Fort': return '🏰';
        case 'Hill Station': return '⛰️';
        case 'Nature': return '🌳';
        case 'Wildlife': return '🦁';
        case 'Lake': return '🌊';
        case 'Museum': return '🏛️';
        case 'Monument': return '🗿';
        case 'Garden': return '🌺';
        case 'Waterfall': return '💧';
        case 'Cave': return '🕳️';
        case 'Desert': return '🏜️';
        case 'Island': return '🏝️';
        case 'Market': return '🛍️';
        case 'Religious': return '🙏';
        case 'Historical': return '📜';
        default: return '📍';
    }
};

// Create SVG marker icon
const createMarkerIcon = (type?: string, isSelected: boolean = false): string => {
    const emoji = getPlaceEmoji(type);
    const bgColor = isSelected ? '%2322c55e' : '%231a1a1a';
    const borderColor = isSelected ? '%2316a34a' : '%23ffffff33';
    const size = isSelected ? 44 : 36;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
            <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-size="${isSelected ? 20 : 16}">${emoji}</text>
        </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
};

// --- Types ---
interface Place {
    _id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    description?: string;
    cityName: string;
    type?: string;
    rating?: number;
    visitDuration?: string;
}

interface MapProps {
    center: [number, number];
    zoom: number;
    selectedMarkers?: string[];
    onMarkerClick?: (id: string) => void;
    onStateClick?: (stateName: string) => void;
    route?: Array<[number, number]>;
}

// Map container style
const containerStyle = {
    width: '100%',
    height: '100%'
};

export const Map: FC<MapProps> = ({ center, zoom, onStateClick, route }) => {
    // --- Google Maps Loader ---
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
    });

    // --- Trip Store ---
    const {
        selectedPlaces,
        togglePlace,
        isPlaceSelected,
        showRouteOnMap,
        getRouteCoordinates
    } = useTripStore();

    // --- State ---
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [geoData, setGeoData] = useState<any>(null);

    // Interaction State
    const [activeState, setActiveState] = useState<string | null>(null);
    const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);
    const [selectedInfoWindow, setSelectedInfoWindow] = useState<Place | null>(null);
    const [googlePlaces, setGooglePlaces] = useState<Place[]>([]);
    const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

    // Refs
    const dataLayerRef = useRef<google.maps.Data | null>(null);
    const activeFeatureRef = useRef<google.maps.Data.Feature | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // --- Data Fetching (GeoJSON only) ---
    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson');
                const data = await response.json();
                setGeoData(data);
            } catch (error) {
                console.error("Error fetching GeoJSON:", error);
            }
        };

        fetchGeoData();
    }, []);

    // --- GeoJSON Data Layer Setup ---
    useEffect(() => {
        if (!map || !geoData) return;

        // Clear existing data layer
        if (dataLayerRef.current) {
            dataLayerRef.current.setMap(null);
        }

        // Create new data layer
        const dataLayer = new google.maps.Data();
        dataLayerRef.current = dataLayer;

        // Add GeoJSON
        dataLayer.addGeoJson(geoData);

        // Set initial style
        dataLayer.setStyle((feature) => {
            const stateName = feature.getProperty('NAME_1') || feature.getProperty('ST_NM');
            const isSelf = stateName === activeState;
            const hasActive = activeState !== null;

            return {
                fillColor: isSelf ? '#ffedd5' : '#3b82f6',
                fillOpacity: hasActive ? (isSelf ? 0.7 : 0.2) : 0.4,
                strokeColor: 'white',
                strokeWeight: isSelf ? 2 : 1,
            };
        });

        // Mouse events
        dataLayer.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
            const stateName = event.feature.getProperty('NAME_1') || event.feature.getProperty('ST_NM');
            setHoveredStateName(stateName);

            if (activeState !== stateName) {
                dataLayer.overrideStyle(event.feature, {
                    strokeColor: '#ffa500',
                    strokeWeight: 2,
                    fillOpacity: 0.5
                });
            }
        });

        dataLayer.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
            setHoveredStateName(null);
            const stateName = event.feature.getProperty('NAME_1') || event.feature.getProperty('ST_NM');

            if (activeState !== stateName) {
                dataLayer.revertStyle(event.feature);
            }
        });

        dataLayer.addListener('click', (event: google.maps.Data.MouseEvent) => {
            const stateName = event.feature.getProperty('NAME_1') || event.feature.getProperty('ST_NM');

            // Toggle off if clicking same state
            if (activeState === stateName) {
                setActiveState(null);
                activeFeatureRef.current = null;
                dataLayer.revertStyle();
                return;
            }

            // Revert previous active state style
            if (activeFeatureRef.current) {
                dataLayer.revertStyle(activeFeatureRef.current);
            }

            // Set new active state
            setActiveState(stateName as string);
            activeFeatureRef.current = event.feature;

            // Highlight selected state
            dataLayer.overrideStyle(event.feature, {
                strokeColor: '#ff7f50',
                strokeWeight: 3,
                fillOpacity: 0.7
            });

            // Zoom to state bounds
            const bounds = new google.maps.LatLngBounds();
            event.feature.getGeometry()?.forEachLatLng((latLng) => {
                bounds.extend(latLng);
            });
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

            // Fetch places from Google Places API
            fetchPlacesForState(stateName as string);

            if (onStateClick) onStateClick(stateName as string);
        });

        dataLayer.setMap(map);

        return () => {
            dataLayer.setMap(null);
        };
    }, [map, geoData, activeState, onStateClick]);

    // --- Google Places Type Mapping ---
    const mapGoogleTypeToOurType = useCallback((types: string[]): string => {
        if (types.includes('hindu_temple') || types.includes('church') || types.includes('mosque') || types.includes('synagogue')) return 'Temple';
        if (types.includes('museum')) return 'Museum';
        if (types.includes('park') || types.includes('natural_feature')) return 'Nature';
        if (types.includes('zoo') || types.includes('aquarium')) return 'Wildlife';
        if (types.includes('amusement_park')) return 'Nature';
        if (types.includes('art_gallery')) return 'Museum';
        if (types.includes('shopping_mall') || types.includes('store')) return 'Market';
        if (types.includes('tourist_attraction') || types.includes('point_of_interest')) return 'Monument';
        if (types.includes('establishment')) return 'Historical';
        return 'Tourist Place';
    }, []);

    // --- Fetch Places from Google Places API ---
    const fetchPlacesForState = useCallback((stateName: string) => {
        if (!map) return;

        setIsLoadingPlaces(true);
        setGooglePlaces([]);

        // Initialize PlacesService if not already done
        if (!placesServiceRef.current) {
            placesServiceRef.current = new google.maps.places.PlacesService(map);
        }

        const service = placesServiceRef.current;

        const request: google.maps.places.TextSearchRequest = {
            query: `famous tourist attractions monuments temples in ${stateName} India`,
        };

        service.textSearch(request, (results, status) => {
            setIsLoadingPlaces(false);

            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const places: Place[] = results.slice(0, 15).map((place) => ({
                    _id: place.place_id || `gplace-${Math.random()}`,
                    name: place.name || 'Unknown Place',
                    coordinates: {
                        lat: place.geometry?.location?.lat() || 0,
                        lng: place.geometry?.location?.lng() || 0
                    },
                    cityName: stateName,
                    type: mapGoogleTypeToOurType(place.types || []),
                    rating: place.rating,
                    description: place.formatted_address
                }));
                setGooglePlaces(places);
            } else {
                console.warn('Places API failed for', stateName);
            }
        });
    }, [map, mapGoogleTypeToOurType]);

    // --- Active Markers (Google Places only) ---
    const activeMarkers = useMemo(() => {
        if (!activeState) return [];
        return googlePlaces;
    }, [activeState, googlePlaces]);

    // --- Route Coordinates for Polyline ---
    const routeCoordinates = useMemo(() => {
        if (route && route.length > 0) {
            return route.map(([lat, lng]) => ({ lat, lng }));
        }
        return [];
    }, [route]);

    // --- Directions for Trip Route ---
    const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);

    useEffect(() => {
        if (!map || !showRouteOnMap) {
            setDirectionsResult(null);
            return;
        }

        const routeCoords = getRouteCoordinates();
        if (routeCoords.length < 2) {
            setDirectionsResult(null);
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: routeCoords[0][0], lng: routeCoords[0][1] };
        const destination = { lat: routeCoords[routeCoords.length - 1][0], lng: routeCoords[routeCoords.length - 1][1] };
        const waypoints = routeCoords.slice(1, -1).map(coord => ({
            location: { lat: coord[0], lng: coord[1] },
            stopover: true
        }));

        directionsService.route({
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING
        }).then(result => {
            setDirectionsResult(result);
        }).catch(err => {
            console.error('Directions failed:', err);
            setDirectionsResult(null);
        });
    }, [map, showRouteOnMap, getRouteCoordinates]);

    // --- Map Callbacks ---
    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // --- Loading / Error States ---
    if (loadError) {
        return (
            <div className="flex items-center justify-center h-full bg-neutral-900 text-white">
                <div className="text-center p-8">
                    <h3 className="text-xl font-bold text-red-400 mb-2">Failed to load Google Maps</h3>
                    <p className="text-gray-400">Please check your API key and try again.</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-full bg-neutral-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={{ lat: center[0], lng: center[1] }}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: darkMapStyle,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'greedy'
                }}
            >
                {/* Place Markers */}
                {activeMarkers
                    .filter(place =>
                        place.coordinates &&
                        place.coordinates.lat !== 0 &&
                        place.coordinates.lng !== 0 &&
                        place.coordinates.lat > 5 && place.coordinates.lat < 40 &&
                        place.coordinates.lng > 65 && place.coordinates.lng < 100
                    )
                    .map(place => {
                        const placeIsSelected = isPlaceSelected(place._id);
                        return (
                            <Marker
                                key={place._id}
                                position={{ lat: place.coordinates.lat, lng: place.coordinates.lng }}
                                icon={{
                                    url: createMarkerIcon(place.type, placeIsSelected),
                                    scaledSize: new google.maps.Size(placeIsSelected ? 44 : 36, placeIsSelected ? 44 : 36),
                                    anchor: new google.maps.Point(placeIsSelected ? 22 : 18, placeIsSelected ? 22 : 18)
                                }}
                                onClick={() => setSelectedInfoWindow(place)}
                            />
                        );
                    })}

                {/* Info Window */}
                {selectedInfoWindow && (
                    <InfoWindow
                        position={{
                            lat: selectedInfoWindow.coordinates.lat,
                            lng: selectedInfoWindow.coordinates.lng
                        }}
                        onCloseClick={() => setSelectedInfoWindow(null)}
                    >
                        <div className="min-w-[200px] p-2 font-sans">
                            <h3 className="font-bold text-lg text-orange-600">{selectedInfoWindow.name}</h3>
                            <div className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">
                                {selectedInfoWindow.type}
                            </div>
                            {selectedInfoWindow.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                    {selectedInfoWindow.description.substring(0, 100)}...
                                </p>
                            )}
                            <div className="flex gap-2 text-xs text-gray-500 mb-3">
                                <span>⭐ {selectedInfoWindow.rating || 4.5}</span>
                                <span>🕒 {selectedInfoWindow.visitDuration || '1 hr'}</span>
                            </div>
                            <button
                                onClick={() => {
                                    togglePlace(selectedInfoWindow);
                                    setSelectedInfoWindow(null);
                                }}
                                className={`w-full py-2 rounded-md text-xs font-bold transition-all shadow-sm ${isPlaceSelected(selectedInfoWindow._id)
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                            >
                                {isPlaceSelected(selectedInfoWindow._id) ? '✓ Remove from Trip' : '+ Add to Trip'}
                            </button>
                        </div>
                    </InfoWindow>
                )}

                {/* Route polyline from props */}
                {routeCoordinates.length > 0 && (
                    <Polyline
                        path={routeCoordinates}
                        options={{
                            strokeColor: '#ec4899',
                            strokeWeight: 4,
                            strokeOpacity: 0.8,
                        }}
                    />
                )}

                {/* Driving Route from Google Directions */}
                {directionsResult && (
                    <DirectionsRenderer
                        directions={directionsResult}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: '#22c55e',
                                strokeWeight: 5,
                                strokeOpacity: 0.9
                            }
                        }}
                    />
                )}
            </GoogleMap>

            {/* Custom Tooltip / Overlay for Hovered State */}
            {hoveredStateName && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full border border-white/20 shadow-2xl z-[1000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
                    <span className="text-lg font-light tracking-widest">{hoveredStateName}</span>
                </div>
            )}

            {/* Key Places Panel - shows when state is SELECTED (clicked) */}
            {activeState && activeMarkers.length > 0 && (
                <div
                    className="absolute top-20 right-4 bg-black/90 backdrop-blur-lg text-white p-4 rounded-xl border border-white/20 shadow-2xl z-[1000] max-w-sm max-h-[60vh] overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300"
                >
                    <div className="flex items-center justify-between mb-3 border-b border-white/20 pb-2">
                        <h4 className="font-bold text-accent text-sm uppercase tracking-wider">
                            Key Places in {activeState}
                        </h4>
                        <div className="flex items-center gap-2">
                            {selectedPlaces.length > 0 && (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                                    {selectedPlaces.length} selected
                                </span>
                            )}
                            <button
                                onClick={() => setActiveState(null)}
                                className="text-gray-400 hover:text-white text-lg"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    {isLoadingPlaces && (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                            <span className="ml-2 text-sm text-gray-400">Finding places...</span>
                        </div>
                    )}
                    <ul className="space-y-2">
                        {activeMarkers.slice(0, 10).map((place) => {
                            const isSelected = isPlaceSelected(place._id);
                            return (
                                <li
                                    key={place._id}
                                    className={`flex items-center gap-2 text-sm p-2 rounded-lg cursor-pointer transition-all hover:bg-white/10 ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/40' : 'border border-transparent'
                                        }`}
                                    onClick={() => togglePlace(place)}
                                >
                                    <span className="text-lg flex-shrink-0">
                                        {getPlaceEmoji(place.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium text-white/90 block truncate">{place.name}</span>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{place.type || 'Tourist Place'}</span>
                                            {place.rating && <span>⭐ {place.rating}</span>}
                                        </div>
                                    </div>
                                    <button
                                        className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold transition-all ${isSelected
                                            ? 'bg-red-500/80 text-white hover:bg-red-600'
                                            : 'bg-emerald-600/80 text-white hover:bg-emerald-700'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePlace(place);
                                        }}
                                    >
                                        {isSelected ? '✓' : '+'}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {activeMarkers.length > 10 && (
                        <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-white/10">
                            +{activeMarkers.length - 10} more places... Click on map markers to see all.
                        </p>
                    )}
                </div>
            )}

            {/* No places message when clicking on a state without data */}
            {activeState && activeMarkers.length === 0 && (
                <div className="absolute top-20 right-4 bg-black/85 backdrop-blur-lg text-white p-4 rounded-xl border border-white/20 shadow-2xl z-[1000] max-w-xs animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-400">
                            No tourist places available for {activeState} yet.
                        </p>
                        <button
                            onClick={() => setActiveState(null)}
                            className="text-gray-400 hover:text-white text-lg ml-2"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Guide overlay when nothing is selected */}
            {!activeState && (
                <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-sm text-white p-4 rounded-xl border border-white/10 z-[1000] max-w-xs transition-opacity duration-500">
                    <h4 className="font-bold text-accent mb-1">Explore India</h4>
                    <p className="text-sm text-gray-300">Click on a state to zoom in and discover popular destinations.</p>
                </div>
            )}
        </div>
    );
};
