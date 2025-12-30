import { FC } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icons using leaflet-color-markers for a more lavish look
// Teal for unselected (matches the secondary/teal theme)
const UnselectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-teal.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Orange/Gold for selected (matches the accent theme)
const SelectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface MapProps {
    center: [number, number];
    zoom: number;
    markers: Array<{
        id: string;
        lat: number;
        lng: number;
        title: string;
        description: string;
    }>;
    selectedMarkers: string[];
    onMarkerClick: (id: string) => void;
    route?: Array<[number, number]>;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export const Map: FC<MapProps> = ({ center, zoom, markers, selectedMarkers, onMarkerClick, route }) => {

    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className="z-0 bg-neutral-100">
            <ChangeView center={center} zoom={zoom} />
            {/* Using CartoDB Voyager for a cleaner, more modern look */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {markers.map(marker => (
                <Marker
                    key={marker.id}
                    position={[marker.lat, marker.lng]}
                    icon={selectedMarkers.includes(marker.id) ? SelectedIcon : UnselectedIcon}
                    eventHandlers={{
                        click: () => onMarkerClick(marker.id),
                    }}
                >
                    <Popup className="font-sans">
                        <div className="p-1">
                            <h3 className="font-bold text-lg text-primary">{marker.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{marker.description}</p>
                            <button
                                onClick={() => onMarkerClick(marker.id)}
                                className={`w-full py-1.5 rounded-md text-xs font-bold transition-colors ${
                                    selectedMarkers.includes(marker.id)
                                    ? 'bg-accent text-white hover:bg-orange-600'
                                    : 'bg-secondary/20 text-secondary hover:bg-secondary hover:text-white'
                                }`}
                            >
                                {selectedMarkers.includes(marker.id) ? 'Remove from Trip' : 'Add to Trip'}
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {route && route.length > 0 && (
                <Polyline
                    positions={route}
                    pathOptions={{ color: '#FF7F50', weight: 4, opacity: 0.8, dashArray: '10, 10' }}
                />
            )}
        </MapContainer>
    );
};
