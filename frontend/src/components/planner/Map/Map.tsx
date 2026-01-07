import { FC, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { useTripStore } from '../../../stores/tripStore';

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

const createMiniIcon = (type?: string, isSelected: boolean = false) => {
    const emoji = getPlaceEmoji(type);
    const borderColor = isSelected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(255,255,255,0.3)';
    const boxShadow = isSelected
        ? '0 4px 12px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.4)'
        : '0 4px 12px rgba(0,0,0,0.4), 0 0 20px rgba(255,165,0,0.3)';

    return L.divIcon({
        html: `
            <div style="
                background: linear-gradient(135deg, ${isSelected ? 'rgba(34, 197, 94, 0.9)' : 'rgba(0,0,0,0.9)'} 0%, ${isSelected ? 'rgba(22, 163, 74, 0.95)' : 'rgba(30,30,30,0.95)'} 100%);
                border: 3px solid ${borderColor};
                border-radius: 50%;
                width: ${isSelected ? '40px' : '32px'};
                height: ${isSelected ? '40px' : '32px'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${isSelected ? '20px' : '16px'};
                box-shadow: ${boxShadow};
                cursor: pointer;
                transition: all 0.2s ease;
                animation: popIn 0.3s ease-out;
            ">
                ${emoji}
            </div>
            <style>
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
            </style>
        `,
        className: 'mini-place-icon',
        iconSize: isSelected ? [40, 40] : [32, 32],
        iconAnchor: isSelected ? [20, 20] : [16, 16],
        popupAnchor: [0, isSelected ? -20 : -16]
    });
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

interface City {
    _id: string;
    name: string;
    stateCode: string;
}

interface MapProps {
    center: [number, number];
    zoom: number;
    // We still accept these props if parent wants to control selected markers/route
    selectedMarkers?: string[];
    onMarkerClick?: (id: string) => void;
    onStateClick?: (stateName: string) => void;
    route?: Array<[number, number]>;
}

// --- Helper Components ---
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    const initialViewSet = useRef(false);

    useEffect(() => {
        // Only set view on initial load
        if (!initialViewSet.current) {
            map.setView(center, zoom);
            initialViewSet.current = true;
        }
    }, [center, zoom, map]);

    return null;
}

// Component to fit map bounds to a state polygon
function FitStateBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
        }
    }, [bounds, map]);

    return null;
}

export const Map: FC<MapProps> = ({ center, zoom, onStateClick, route }) => {
    // --- Trip Store ---
    const {
        selectedPlaces,
        togglePlace,
        isPlaceSelected,
        showRouteOnMap,
        getRouteCoordinates
    } = useTripStore();

    // --- State ---
    const [geoData, setGeoData] = useState<any>(null);
    const [places, setPlaces] = useState<Place[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    // Interaction State
    const [activeState, setActiveState] = useState<string | null>(null);
    const [hoveredStateName, setHoveredStateName] = useState<string | null>(null);
    const [selectedStateBounds, setSelectedStateBounds] = useState<L.LatLngBounds | null>(null);

    // Refs for state management
    const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const currentStateRef = useRef<string | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch GeoJSON for India States
                const geoResponse = await axios.get('https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson');
                setGeoData(geoResponse.data);

                // 2. Fetch Backend Data
                // In a real app, use environment variable for API URL
                const [placesRes, citiesRes] = await Promise.all([
                    axios.get('http://localhost:3001/api/places'),
                    axios.get('http://localhost:3001/api/cities')
                ]);

                setPlaces(placesRes.data);
                setCities(citiesRes.data);

            } catch (error) {
                console.error("Error fetching map data:", error);
            }
        };

        fetchData();
    }, []);

    // --- Data Processing ---
    // Create a generic mapping of State Name -> List of Places
    // We need to link Place -> City -> State Code -> State Name (from GeoJSON)
    // GeoJSON properties usually have 'NAME_1' or 'ST_NM' for state name.

    // 1. Map City Name -> State Code
    const cityToStateCode = useMemo(() => {
        const map: Record<string, string> = {};
        cities.forEach(c => {
            map[c.name] = c.stateCode;
        });
        return map;
    }, [cities]);

    // 2. Group Places by State Code
    const placesByStateCode = useMemo(() => {
        const groups: Record<string, Place[]> = {};
        places.forEach(p => {
            const sCode = cityToStateCode[p.cityName];
            if (sCode) {
                if (!groups[sCode]) groups[sCode] = [];
                groups[sCode].push(p);
            }
        });
        return groups;
    }, [places, cityToStateCode]);

    // --- Event Handlers ---

    // Map GeoJSON state names to our internal State Codes if necessary
    // Simple lookup for demo. In production, be robust about spelling (Rajasthan vs Rajasthan).
    const getStateCode = useCallback((featureProperties: any) => {
        // This GeoJSON often uses 'NAME_1' or 'ST_NM'
        const name = featureProperties.NAME_1 || featureProperties.ST_NM;

        // Mapping from GeoJSON state names to database stateCode values
        // Database uses truncated uppercase names (10 chars max with underscores)
        const nameToCode: Record<string, string> = {
            // States - mapped to actual database stateCode values
            'Andhra Pradesh': 'ANDHRA_PRA',
            'Arunachal Pradesh': 'ARUNACHAL_',
            'Assam': 'ASSAM',
            'Bihar': 'BIHAR',
            'Chhattisgarh': 'CHHATTISG',
            'Goa': 'GOA',
            'Gujarat': 'GUJARAT',
            'Haryana': 'HARYANA',
            'Himachal Pradesh': 'HIMACHAL_P',
            'Jharkhand': 'JHARKHAND',
            'Karnataka': 'KARNATAKA',
            'Kerala': 'KERALA',
            'Madhya Pradesh': 'MADHYA_PRA',
            'Maharashtra': 'MAHARASHTR',
            'Manipur': 'MANIPUR',
            'Meghalaya': 'MEGHALAYA',
            'Mizoram': 'MIZORAM',
            'Nagaland': 'NAGALAND',
            'Odisha': 'ODISHA',
            'Orissa': 'ODISHA', // Alternate spelling
            'Punjab': 'PUNJAB',
            'Rajasthan': 'RAJASTHAN',
            'Sikkim': 'SIKKIM',
            'Tamil Nadu': 'TAMIL_NADU',
            'Telangana': 'TELANGANA',
            'Tripura': 'TRIPURA',
            'Uttar Pradesh': 'UTTAR_PRAD',
            'Uttarakhand': 'UTTARAKHAN',
            'Uttaranchal': 'UTTARAKHAN', // Alternate name
            'West Bengal': 'WEST_BENGA',
            // Union Territories
            'Andaman and Nicobar Islands': 'ANDAMAN_NI',
            'Andaman and Nicobar': 'ANDAMAN_NI',
            'Chandigarh': 'CHANDIGARH',
            'Dadra and Nagar Haveli and Daman and Diu': 'DADRA_NAGA',
            'Dadra and Nagar Haveli': 'DADRA_NAGA',
            'Daman and Diu': 'DAMAN_DIU',
            'Delhi': 'DELHI',
            'NCT of Delhi': 'DELHI',
            'Jammu and Kashmir': 'JAMMU_KASH',
            'Jammu & Kashmir': 'JAMMU_KASH',
            'Ladakh': 'LADAKH',
            'Lakshadweep': 'LAKSHADWEE',
            'Puducherry': 'PUDUCHERRY',
            'Pondicherry': 'PUDUCHERRY' // Alternate name
        };
        return nameToCode[name] || null;
    }, []);

    // Hover just shows state name tooltip (lightweight)
    const highlightFeature = (e: any) => {
        const layer = e.target;
        const stateName = layer.feature.properties.NAME_1 || layer.feature.properties.ST_NM;

        // Only update tooltip, not the places panel
        setHoveredStateName(stateName);

        // Light visual highlight on hover
        if (!activeState || activeState !== stateName) {
            layer.setStyle({
                weight: 2,
                color: '#ffa500',
                fillOpacity: 0.5
            });
        }
    };

    const resetHighlight = (e: any) => {
        const layer = e.target;
        const stateName = layer.feature.properties.NAME_1 || layer.feature.properties.ST_NM;

        setHoveredStateName(null);

        // Reset style if not the active/selected state
        if (activeState !== stateName) {
            layer.setStyle(style(layer.feature));
        }
    };

    // Click selects state, zooms in, and shows places
    const selectState = (e: any) => {
        const layer = e.target;
        const stateName = layer.feature.properties.NAME_1 || layer.feature.properties.ST_NM;

        // If clicking the same state, deselect
        if (activeState === stateName) {
            setActiveState(null);
            setSelectedStateBounds(null);
            currentStateRef.current = null;
            layer.setStyle(style(layer.feature));
            return;
        }

        // Clear any pending resets
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }

        // Set active state
        currentStateRef.current = stateName;
        setActiveState(stateName);

        // Highlight the selected state
        layer.setStyle({
            weight: 3,
            color: '#ff7f50',
            dashArray: '',
            fillOpacity: 0.7
        });
        layer.bringToFront();

        // Zoom to state bounds
        const bounds = layer.getBounds();
        setSelectedStateBounds(bounds);

        // Optionally notify parent
        if (onStateClick) onStateClick(stateName);
    };

    const onEachFeature = (_feature: any, layer: any) => {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: selectState
        });
    };

    const style = (feature: any) => {
        // If an active state exists, others should be dim
        const isSelf = (feature.properties.NAME_1 || feature.properties.ST_NM) === activeState;
        const hasActive = activeState !== null;

        return {
            fillColor: isSelf ? '#ffedd5' : '#3b82f6', // Orange-ish if active, else Blue-ish
            weight: isSelf ? 2 : 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: hasActive ? (isSelf ? 0.7 : 0.2) : 0.4
        };
    };

    // Note: getCityIdForPlace removed - now using place._id directly for selection

    // --- Markers ---
    // Only show markers if there is an active state and we have places for it
    const activeMarkers = useMemo(() => {
        if (!activeState) return [];
        const code = getStateCode({ NAME_1: activeState }); // Quick lookup
        if (!code) return [];
        return placesByStateCode[code] || [];
    }, [activeState, placesByStateCode, getStateCode]);


    return (
        <div className="relative h-full w-full">
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0 bg-neutral-900">
                <ChangeView center={center} zoom={zoom} />
                <FitStateBounds bounds={selectedStateBounds} />

                {/* Dark Custom Tile Layer for Premium Feel */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {geoData && (
                    <GeoJSON
                        data={geoData}
                        style={style}
                        onEachFeature={onEachFeature}
                    />
                )}

                {activeMarkers
                    .filter(place =>
                        place.coordinates &&
                        place.coordinates.lat !== 0 &&
                        place.coordinates.lng !== 0 &&
                        // Sanity check for Indian coordinates (lat ~8-37, lng ~68-97)
                        place.coordinates.lat > 5 && place.coordinates.lat < 40 &&
                        place.coordinates.lng > 65 && place.coordinates.lng < 100
                    )
                    .map(place => {
                        const placeIsSelected = isPlaceSelected(place._id);
                        const miniIcon = createMiniIcon(place.type, placeIsSelected);

                        return (
                            <Marker
                                key={place._id}
                                position={[place.coordinates.lat, place.coordinates.lng]}
                                icon={miniIcon}
                                eventHandlers={{
                                    click: () => {
                                        togglePlace(place);
                                    },
                                }}
                            >
                                <Popup className="font-sans">
                                    <div className="min-w-[200px]">
                                        <h3 className="font-bold text-lg text-primary">{place.name}</h3>
                                        <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">{place.type}</div>
                                        {place.description && <p className="text-sm text-gray-600 mb-2">{place.description.substring(0, 100)}...</p>}
                                        <div className="flex gap-2 text-xs text-gray-500 mb-3">
                                            <span>⭐ {place.rating || 4.5}</span>
                                            <span>🕒 {place.visitDuration || '1 hr'}</span>
                                        </div>
                                        <button
                                            onClick={() => togglePlace(place)}
                                            className={`w-full py-2 rounded-md text-xs font-bold transition-all shadow-sm ${placeIsSelected
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                }`}
                                        >
                                            {placeIsSelected ? '✓ Remove from Trip' : '+ Add to Trip'}
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                {/* Route polyline from props or store */}
                {route && route.length > 0 && (
                    <Polyline
                        positions={route}
                        pathOptions={{ color: '#ec4899', weight: 4, opacity: 0.8, dashArray: '10, 10' }}
                    />
                )}

                {/* Route polyline from trip store */}
                {showRouteOnMap && getRouteCoordinates().length > 1 && (
                    <Polyline
                        positions={getRouteCoordinates()}
                        pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.9, dashArray: '15, 8' }}
                    />
                )}
            </MapContainer>

            {/* Custom Tooltip / Overlay for Active State */}
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
                                onClick={() => {
                                    setActiveState(null);
                                    setSelectedStateBounds(null);
                                }}
                                className="text-gray-400 hover:text-white text-lg"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
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
                            onClick={() => {
                                setActiveState(null);
                                setSelectedStateBounds(null);
                            }}
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
