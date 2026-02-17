import { FC, useMemo } from 'react';
import { Marker } from '@react-google-maps/api';

interface PlaceData {
    _id: string;
    name: string;
    cityName: string;
    coordinates: { lat: number; lng: number };
    type?: string;
    rating?: number;
}

interface CityClusterMarkersProps {
    places: PlaceData[];
    map: google.maps.Map | null;
    visible: boolean;
    onPlaceClick?: (place: PlaceData) => void;
}

interface CityCluster {
    city: string;
    center: { lat: number; lng: number };
    places: PlaceData[];
}

const createClusterIcon = (count: number): string => {
    const size = Math.min(48, 28 + count * 3);
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="%233b82f6" stroke="white" stroke-width="2" opacity="0.9"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}" fill="%232563eb" opacity="0.7"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" fill="white" font-size="${Math.min(16, 10 + count)}" font-weight="bold" font-family="Arial">${count}</text>
    </svg>
  `;
    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
};

const getPlaceEmoji = (type?: string): string => {
    switch (type) {
        case 'Temple': return '🛕';
        case 'Beach': return '🏖️';
        case 'Palace':
        case 'Fort': return '🏰';
        case 'Museum': return '🏛️';
        case 'Nature': return '🌳';
        case 'Wildlife': return '🦁';
        case 'Lake': return '🌊';
        case 'Monument': return '🗿';
        default: return '📍';
    }
};

const createPlaceIcon = (type?: string): string => {
    const emoji = getPlaceEmoji(type);
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="13" fill="%231a1a1a" stroke="%23ffffff33" stroke-width="1.5"/>
      <text x="15" y="20" text-anchor="middle" font-size="14">${emoji}</text>
    </svg>
  `;
    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
};

export const CityClusterMarkers: FC<CityClusterMarkersProps> = ({
    places,
    map,
    visible,
    onPlaceClick,
}) => {
    // Group places by city
    const clusters = useMemo((): CityCluster[] => {
        const grouped = new Map<string, PlaceData[]>();
        places.forEach(p => {
            const existing = grouped.get(p.cityName) || [];
            existing.push(p);
            grouped.set(p.cityName, existing);
        });

        return Array.from(grouped.entries()).map(([city, cityPlaces]) => {
            const avgLat = cityPlaces.reduce((s, p) => s + p.coordinates.lat, 0) / cityPlaces.length;
            const avgLng = cityPlaces.reduce((s, p) => s + p.coordinates.lng, 0) / cityPlaces.length;
            return { city, center: { lat: avgLat, lng: avgLng }, places: cityPlaces };
        });
    }, [places]);

    if (!visible || !map) return null;

    // Decide if we should show clusters or individual markers based on zoom
    const zoom = map.getZoom() || 6;
    const showIndividual = zoom >= 10;

    return (
        <>
            {showIndividual
                ? // Show individual place markers
                places.map(p => (
                    <Marker
                        key={`place-${p._id}`}
                        position={{ lat: p.coordinates.lat, lng: p.coordinates.lng }}
                        icon={{
                            url: createPlaceIcon(p.type),
                            scaledSize: new google.maps.Size(30, 30),
                            anchor: new google.maps.Point(15, 15),
                        }}
                        title={`${p.name} ${p.rating ? `⭐${p.rating}` : ''}`}
                        onClick={() => onPlaceClick?.(p)}
                    />
                ))
                : // Show cluster markers
                clusters.map(cluster => (
                    <Marker
                        key={`cluster-${cluster.city}`}
                        position={cluster.center}
                        icon={{
                            url: createClusterIcon(cluster.places.length),
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 20),
                        }}
                        title={`${cluster.city}: ${cluster.places.length} places`}
                        onClick={() => {
                            // Zoom to city
                            const bounds = new google.maps.LatLngBounds();
                            cluster.places.forEach(p =>
                                bounds.extend({ lat: p.coordinates.lat, lng: p.coordinates.lng })
                            );
                            map.fitBounds(bounds, 60);
                        }}
                    />
                ))
            }
        </>
    );
};
