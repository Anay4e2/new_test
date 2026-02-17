import { FC, useEffect, useMemo } from 'react';
import { Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Activity {
    name: string;
    time?: string;
    coordinates?: { lat: number; lng: number };
    type?: string;
}

interface DayData {
    day: number;
    city: string;
    activities: Activity[];
    travel?: {
        from: string;
        to: string;
        distance: number;
        duration: number;
        mode: string;
    };
}

interface CityCoord {
    name: string;
    coordinates: { lat: number; lng: number };
}

interface DayMapViewProps {
    map: google.maps.Map | null;
    dayData: DayData | null;
    cities: CityCoord[];
    totalDays: number;
    onDayChange: (day: number) => void;
}

const createNumberedIcon = (num: number, color = '#3b82f6'): string => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color.replace('#', '%23')}" stroke="white" stroke-width="2"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="Arial">${num}</text>
    </svg>
  `;
    return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
};

export const DayMapView: FC<DayMapViewProps> = ({ map, dayData, cities, totalDays, onDayChange }) => {
    if (!dayData || !map) return null;

    const activityMarkers = useMemo(() => {
        return dayData.activities
            .filter(a => a.coordinates && a.coordinates.lat && a.coordinates.lng)
            .map((a, i) => ({
                ...a,
                index: i + 1,
                position: { lat: a.coordinates!.lat, lng: a.coordinates!.lng },
            }));
    }, [dayData.activities]);

    // Travel polyline for the day
    const travelPath = useMemo(() => {
        if (!dayData.travel) return null;
        const fromCity = cities.find(c => c.name.toLowerCase() === dayData.travel!.from.toLowerCase());
        const toCity = cities.find(c => c.name.toLowerCase() === dayData.travel!.to.toLowerCase());
        if (!fromCity || !toCity) return null;
        return {
            path: [
                { lat: fromCity.coordinates.lat, lng: fromCity.coordinates.lng },
                { lat: toCity.coordinates.lat, lng: toCity.coordinates.lng },
            ],
            midpoint: {
                lat: (fromCity.coordinates.lat + toCity.coordinates.lat) / 2,
                lng: (fromCity.coordinates.lng + toCity.coordinates.lng) / 2,
            },
            distance: dayData.travel!.distance,
        };
    }, [dayData.travel, cities]);

    // Fit map to day bounds
    useEffect(() => {
        if (!map) return;
        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        activityMarkers.forEach(m => {
            bounds.extend(m.position);
            hasPoints = true;
        });

        if (travelPath) {
            travelPath.path.forEach(p => {
                bounds.extend(p);
                hasPoints = true;
            });
        }

        // Also add the main city
        const mainCity = cities.find(c => c.name.toLowerCase() === dayData.city.toLowerCase());
        if (mainCity) {
            bounds.extend({ lat: mainCity.coordinates.lat, lng: mainCity.coordinates.lng });
            hasPoints = true;
        }

        if (hasPoints) {
            map.fitBounds(bounds, { top: 80, right: 50, bottom: 120, left: 50 });
        }
    }, [map, activityMarkers, travelPath, dayData.city, cities]);

    return (
        <>
            {/* Numbered activity markers */}
            {activityMarkers.map(m => (
                <Marker
                    key={`day-act-${m.index}`}
                    position={m.position}
                    icon={{
                        url: createNumberedIcon(m.index),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 16),
                    }}
                    title={m.name}
                />
            ))}

            {/* Travel polyline for the day */}
            {travelPath && (
                <Polyline
                    path={travelPath.path}
                    options={{
                        strokeColor: '#f97316',
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                        icons: [{
                            icon: {
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 3,
                                strokeColor: '#f97316',
                                fillColor: '#f97316',
                                fillOpacity: 1,
                            },
                            offset: '50%',
                        }],
                    }}
                />
            )}

            {/* Distance label at midpoint */}
            {travelPath && (
                <InfoWindow
                    position={travelPath.midpoint}
                    options={{
                        disableAutoPan: true,
                        pixelOffset: new google.maps.Size(0, -10),
                    }}
                >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#ea580c', whiteSpace: 'nowrap' }}>
                        {travelPath.distance} km
                    </div>
                </InfoWindow>
            )}

            {/* Day navigation overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3">
                <button
                    onClick={() => dayData.day > 1 && onDayChange(dayData.day - 1)}
                    disabled={dayData.day <= 1}
                    className="p-2 rounded-full bg-black/70 backdrop-blur-lg text-white border border-white/15 hover:bg-black/80 disabled:opacity-30 transition-all"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="bg-black/70 backdrop-blur-lg text-white px-4 py-2 rounded-full border border-white/15 shadow-lg">
                    <span className="font-bold text-sm">Day {dayData.day}</span>
                    <span className="text-white/60 text-xs ml-2">— {dayData.city}</span>
                </div>

                <button
                    onClick={() => dayData.day < totalDays && onDayChange(dayData.day + 1)}
                    disabled={dayData.day >= totalDays}
                    className="p-2 rounded-full bg-black/70 backdrop-blur-lg text-white border border-white/15 hover:bg-black/80 disabled:opacity-30 transition-all"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </>
    );
};
