import { FC, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { useTripStore } from '../../../stores/tripStore';
import { useItineraryEditStore } from '../../../stores/itineraryEditStore';
import { RouteLayer, TravelSegment } from './RouteLayer';
import { AnimatedMarker } from './AnimatedMarker';
import { TripPlaybackControls } from './TripPlaybackControls';
import { DayMapView } from './DayMapView';
import { MapLegend } from './MapLegend';
import { CityClusterMarkers } from './CityClusterMarkers';
import { PlaceDetailModal } from './PlaceDetailModal';
import { getPlacePhotos } from '../../../services/api';

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
    itinerary?: any[];
    cities?: any[];
    activeDay?: number | null;
    onDaySelect?: (day: number | null) => void;
}

// Map container style
const containerStyle = {
    width: '100%',
    height: '100%'
};

// Initial India-wide view
const INDIA_CENTER = { lat: 22.5, lng: 78.9 };
const INDIA_ZOOM = 5;

export const Map: FC<MapProps> = ({ center, zoom, onStateClick, route, itinerary, cities: propCities, activeDay: propActiveDay, onDaySelect }) => {
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

    const { isEditMode, editableItinerary, addActivity } = useItineraryEditStore();

    // --- State ---
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [geoData, setGeoData] = useState<any>(null);

    // Interaction State
    const [activeState, setActiveState] = useState<string | null>(null);
    const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);
    const [selectedInfoWindow, setSelectedInfoWindow] = useState<Place | null>(null);
    const [detailPlace, setDetailPlace] = useState<any>(null);
    const [infoWindowPhoto, setInfoWindowPhoto] = useState<string | null>(null);
    const [googlePlaces, setGooglePlaces] = useState<Place[]>([]);
    const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

    // Route visualization state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [visibleModes, setVisibleModes] = useState<Set<string>>(new Set(['train', 'road', 'flight', 'bus']));
    const [showActivities, setShowActivities] = useState(true);
    const [showHotels, setShowHotels] = useState(true);
    const [internalActiveDay, setInternalActiveDay] = useState<number | null>(null);

    const activeDay = propActiveDay ?? internalActiveDay;
    const setActiveDay = onDaySelect ?? setInternalActiveDay;

    // Fetch a thumbnail photo when InfoWindow opens
    useEffect(() => {
        if (!selectedInfoWindow) {
            setInfoWindowPhoto(null);
            return;
        }
        let cancelled = false;
        getPlacePhotos(selectedInfoWindow.name, (selectedInfoWindow as any).cityName || (selectedInfoWindow as any).city)
            .then((data) => {
                if (!cancelled && data.photos.length > 0) {
                    setInfoWindowPhoto(data.photos[0]);
                }
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [selectedInfoWindow]);

    // Refs
    const dataLayerRef = useRef<google.maps.Data | null>(null);
    const activeFeatureRef = useRef<google.maps.Data.Feature | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);
    const prevZoomRef = useRef<number | null>(null);
    const geoSetupDoneRef = useRef(false);
    const onStateClickRef = useRef(onStateClick);
    onStateClickRef.current = onStateClick;
    const fetchPlacesRef = useRef<((s: string) => void) | null>(null);

    // --- Smooth pan/zoom when props change ---
    useEffect(() => {
        if (!map) return;
        const newCenter = { lat: center[0], lng: center[1] };
        const prev = prevCenterRef.current;
        const prevZoom = prevZoomRef.current;

        // Only animate if values actually changed
        const centerChanged = !prev || Math.abs(prev.lat - newCenter.lat) > 0.01 || Math.abs(prev.lng - newCenter.lng) > 0.01;
        const zoomChanged = prevZoom !== null && prevZoom !== zoom;

        if (centerChanged) {
            map.panTo(newCenter);
        }
        if (zoomChanged || (centerChanged && prevZoom === null)) {
            // Slight delay so panTo animation starts first
            setTimeout(() => map.setZoom(zoom), centerChanged ? 300 : 0);
        }

        prevCenterRef.current = newCenter;
        prevZoomRef.current = zoom;
    }, [map, center, zoom]);

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

    // --- GeoJSON Data Layer Setup (runs once when map + geoData are ready) ---
    useEffect(() => {
        if (!map || !geoData || geoSetupDoneRef.current) return;
        geoSetupDoneRef.current = true;

        // Create data layer
        const dataLayer = new google.maps.Data();
        dataLayerRef.current = dataLayer;

        // Add GeoJSON
        dataLayer.addGeoJson(geoData);

        // Set initial default style
        dataLayer.setStyle(() => ({
            fillColor: '#3b82f6',
            fillOpacity: 0.4,
            strokeColor: 'white',
            strokeWeight: 1,
        }));

        // Mouse events
        dataLayer.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
            const stateName = event.feature.getProperty('NAME_1') || event.feature.getProperty('ST_NM');
            setHoveredStateName(stateName as string);
            dataLayer.overrideStyle(event.feature, {
                strokeColor: '#ffa500',
                strokeWeight: 2,
                fillOpacity: 0.55
            });
        });

        dataLayer.addListener('mouseout', (event: google.maps.Data.MouseEvent) => {
            setHoveredStateName(null);
            dataLayer.revertStyle(event.feature);
        });

        dataLayer.addListener('click', (event: google.maps.Data.MouseEvent) => {
            const stateName = event.feature.getProperty('NAME_1') || event.feature.getProperty('ST_NM');

            setActiveState(prev => {
                if (prev === stateName) {
                    // Toggle OFF – revert everything and zoom back to India
                    activeFeatureRef.current = null;
                    dataLayer.revertStyle();
                    map.panTo(INDIA_CENTER);
                    setTimeout(() => map.setZoom(INDIA_ZOOM), 300);
                    setSelectedInfoWindow(null);
                    setGooglePlaces([]);
                    return null;
                }

                // Switching to a different state – clear previous place data
                setSelectedInfoWindow(null);
                setGooglePlaces([]);

                // Revert previous active state style
                if (activeFeatureRef.current) {
                    dataLayer.revertStyle(activeFeatureRef.current);
                }

                activeFeatureRef.current = event.feature;

                // Highlight selected state
                dataLayer.overrideStyle(event.feature, {
                    fillColor: '#ffedd5',
                    strokeColor: '#ff7f50',
                    strokeWeight: 3,
                    fillOpacity: 0.7
                });

                // Smooth zoom to state bounds
                const bounds = new google.maps.LatLngBounds();
                event.feature.getGeometry()?.forEachLatLng((latLng) => {
                    bounds.extend(latLng);
                });
                map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

                // Fetch places from Google Places API
                if (fetchPlacesRef.current) fetchPlacesRef.current(stateName as string);

                if (onStateClickRef.current) onStateClickRef.current(stateName as string);

                return stateName as string;
            });
        });

        dataLayer.setMap(map);

        return () => {
            dataLayer.setMap(null);
            geoSetupDoneRef.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, geoData]);

    // --- Update GeoJSON styles when activeState changes (without re-creating the layer) ---
    useEffect(() => {
        if (!dataLayerRef.current) return;
        const dl = dataLayerRef.current;
        dl.setStyle((feature) => {
            const stateName = feature.getProperty('NAME_1') || feature.getProperty('ST_NM');
            const isSelf = stateName === activeState;
            const hasActive = activeState !== null;
            return {
                fillColor: isSelf ? '#ffedd5' : '#3b82f6',
                fillOpacity: hasActive ? (isSelf ? 0.7 : 0.2) : 0.4,
                strokeColor: isSelf ? '#ff7f50' : 'white',
                strokeWeight: isSelf ? 3 : 1,
            };
        });
    }, [activeState]);

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
    fetchPlacesRef.current = fetchPlacesForState;

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

    // --- Build travel segments from itinerary ---
    const travelSegments: TravelSegment[] = useMemo(() => {
        if (!itinerary || !propCities) return [];
        const segments: TravelSegment[] = [];
        itinerary.forEach((day: any) => {
            if (day.travel) {
                const fromCity = propCities.find((c: any) => c.name?.toLowerCase() === day.travel.from?.toLowerCase());
                const toCity = propCities.find((c: any) => c.name?.toLowerCase() === day.travel.to?.toLowerCase());
                if (fromCity?.coordinates && toCity?.coordinates) {
                    segments.push({
                        from: day.travel.from,
                        to: day.travel.to,
                        fromCoords: { lat: fromCity.coordinates.lat, lng: fromCity.coordinates.lng },
                        toCoords: { lat: toCity.coordinates.lat, lng: toCity.coordinates.lng },
                        mode: day.travel.mode || 'road',
                        distance: day.travel.distance,
                        dayIndex: day.day,
                    });
                }
            }
        });
        return segments;
    }, [itinerary, propCities]);

    // --- Build animated marker path & city waypoints ---
    const animatedPath = useMemo((): google.maps.LatLngLiteral[] => {
        if (travelSegments.length === 0) return [];
        const pts: google.maps.LatLngLiteral[] = [travelSegments[0].fromCoords];
        travelSegments.forEach(seg => pts.push(seg.toCoords));
        return pts;
    }, [travelSegments]);

    const cityWaypoints = useMemo(() => {
        if (travelSegments.length === 0) return [];
        const wps: { index: number; name: string }[] = [{ index: 0, name: travelSegments[0].from }];
        travelSegments.forEach((seg, i) => wps.push({ index: i + 1, name: seg.to }));
        return wps;
    }, [travelSegments]);

    const currentDayLabel = useMemo(() => {
        if (!itinerary || activeDay === null) return '';
        const day = itinerary.find((d: any) => d.day === activeDay);
        if (!day) return '';
        const travel = day.travel;
        return travel
            ? `Day ${day.day} — ${travel.from} → ${travel.to}`
            : `Day ${day.day} — ${day.city}`;
    }, [itinerary, activeDay]);

    const activeDayData = useMemo(() => {
        if (!itinerary || activeDay === null) return null;
        return itinerary.find((d: any) => d.day === activeDay) || null;
    }, [itinerary, activeDay]);

    // --- Playback handlers ---
    const handlePlayPause = useCallback(() => {
        if (playbackProgress >= 1) {
            setPlaybackProgress(0);
        }
        setIsPlaying(prev => !prev);
    }, [playbackProgress]);

    const handleFitAll = useCallback(() => {
        if (!map || travelSegments.length === 0) return;
        const bounds = new google.maps.LatLngBounds();
        travelSegments.forEach(seg => {
            bounds.extend(seg.fromCoords);
            bounds.extend(seg.toCoords);
        });
        map.fitBounds(bounds, 60);
        setActiveDay(null);
    }, [map, travelSegments, setActiveDay]);

    const handleToggleMode = useCallback((mode: string) => {
        setVisibleModes(prev => {
            const next = new Set(prev);
            if (next.has(mode)) next.delete(mode);
            else next.add(mode);
            return next;
        });
    }, []);

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
                center={INDIA_CENTER}
                zoom={INDIA_ZOOM}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: darkMapStyle,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'greedy',
                    minZoom: 4,
                    maxZoom: 18,
                    restriction: {
                        latLngBounds: {
                            north: 40,
                            south: 5,
                            east: 100,
                            west: 65,
                        },
                        strictBounds: false,
                    },
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
                        <div className="min-w-[220px] max-w-[280px] p-2 font-sans">
                            {/* Place Photo */}
                            {infoWindowPhoto && (
                                <div className="w-full h-32 rounded-lg overflow-hidden mb-2">
                                    <img
                                        src={infoWindowPhoto}
                                        alt={selectedInfoWindow.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            )}
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

                            {isEditMode ? (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add to Day</div>
                                    <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                        {editableItinerary.map((day, idx) => (
                                            <button
                                                key={day.day}
                                                onClick={() => {
                                                    addActivity(idx, selectedInfoWindow);
                                                    setSelectedInfoWindow(null);
                                                }}
                                                className="px-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold border border-blue-200 transition-colors text-center"
                                                title={`Add to Day ${day.day} (${day.city})`}
                                            >
                                                {day.day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setDetailPlace(selectedInfoWindow);
                                            setSelectedInfoWindow(null);
                                        }}
                                        className="w-full py-2 rounded-md text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-sm"
                                    >
                                        📷 View Photos & Details
                                    </button>
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
                            )}
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

                {/* === Route Visualization Components === */}

                {/* Transport-mode colored route lines */}
                {travelSegments.length > 0 && (
                    <RouteLayer
                        segments={travelSegments}
                        activeDay={activeDay}
                        visibleModes={visibleModes}
                    />
                )}

                {/* Animated traveling marker */}
                {animatedPath.length >= 2 && (
                    <AnimatedMarker
                        map={map}
                        path={animatedPath}
                        cityWaypoints={cityWaypoints}
                        isPlaying={isPlaying}
                        speed={playbackSpeed}
                        onProgress={setPlaybackProgress}
                        onCityReached={() => { }}
                        onComplete={() => setIsPlaying(false)}
                    />
                )}

                {/* Day-by-day map view */}
                {activeDayData && (
                    <DayMapView
                        map={map}
                        dayData={activeDayData}
                        cities={propCities || []}
                        totalDays={itinerary?.length || 0}
                        onDayChange={(d) => setActiveDay(d)}
                    />
                )}

                {/* City cluster markers */}
                <CityClusterMarkers
                    places={selectedPlaces}
                    map={map}
                    visible={showActivities}
                    onPlaceClick={(p) => setSelectedInfoWindow(p as Place)}
                />
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
            {!activeState && !itinerary && (
                <div className="absolute bottom-8 left-8 bg-black/60 backdrop-blur-sm text-white p-4 rounded-xl border border-white/10 z-[1000] max-w-xs transition-opacity duration-500">
                    <h4 className="font-bold text-accent mb-1">Explore India</h4>
                    <p className="text-sm text-gray-300">Click on a state to zoom in and discover popular destinations.</p>
                </div>
            )}

            {/* Map Legend (only when itinerary route exists) */}
            {travelSegments.length > 0 && (
                <MapLegend
                    visibleModes={visibleModes}
                    onToggleMode={handleToggleMode}
                    showActivities={showActivities}
                    onToggleActivities={() => setShowActivities(prev => !prev)}
                    showHotels={showHotels}
                    onToggleHotels={() => setShowHotels(prev => !prev)}
                />
            )}

            {/* Trip Playback Controls */}
            {travelSegments.length > 0 && (
                <TripPlaybackControls
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    speed={playbackSpeed}
                    onSpeedChange={setPlaybackSpeed}
                    progress={playbackProgress}
                    currentDayLabel={currentDayLabel}
                    totalDays={itinerary?.length || 0}
                    activeDay={activeDay}
                    onDayChange={(d) => setActiveDay(d)}
                    onFitAll={handleFitAll}
                    hasRoute={travelSegments.length > 0}
                />
            )}

            {/* Place Detail Modal with Google Photos */}
            <PlaceDetailModal
                place={detailPlace}
                isOpen={!!detailPlace}
                onClose={() => setDetailPlace(null)}
            />
        </div>
    );
};
