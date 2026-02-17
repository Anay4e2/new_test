import { FC, useMemo } from 'react';
import { Polyline } from '@react-google-maps/api';

interface TravelSegment {
    from: string;
    to: string;
    fromCoords: google.maps.LatLngLiteral;
    toCoords: google.maps.LatLngLiteral;
    mode: string;
    distance: number;
    dayIndex: number;
}

interface RouteLayerProps {
    segments: TravelSegment[];
    activeDay: number | null;
    visibleModes: Set<string>;
}

const getModeColor = (mode: string): string => {
    switch (mode?.toLowerCase()) {
        case 'train': return '#ef4444';   // red
        case 'flight': return '#22c55e';  // green
        case 'road':
        case 'bus':
        default: return '#3b82f6';        // blue
    }
};

const getModeWeight = (mode: string): number => {
    switch (mode?.toLowerCase()) {
        case 'flight': return 3;
        case 'train': return 5;
        default: return 4;
    }
};

const isFlightMode = (mode: string): boolean =>
    mode?.toLowerCase() === 'flight';

export const RouteLayer: FC<RouteLayerProps> = ({ segments, activeDay, visibleModes }) => {
    const filteredSegments = useMemo(() =>
        segments.filter(s => visibleModes.has(s.mode?.toLowerCase() || 'road')),
        [segments, visibleModes]
    );

    return (
        <>
            {filteredSegments.map((seg, i) => {
                const isActive = activeDay !== null && seg.dayIndex === activeDay;
                const color = getModeColor(seg.mode);
                const weight = getModeWeight(seg.mode);
                const isFlight = isFlightMode(seg.mode);

                // For flights, create a curved arc via a midpoint
                const path = isFlight
                    ? generateArc(seg.fromCoords, seg.toCoords)
                    : [seg.fromCoords, seg.toCoords];

                return (
                    <Polyline
                        key={`route-${i}`}
                        path={path}
                        options={{
                            strokeColor: color,
                            strokeWeight: isActive ? weight + 2 : weight,
                            strokeOpacity: isActive ? 1 : 0.6,
                            icons: isFlight
                                ? [{
                                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                                    offset: '0',
                                    repeat: '15px',
                                }]
                                : undefined,
                            zIndex: isActive ? 10 : 1,
                        }}
                    />
                );
            })}
        </>
    );
};

/**
 * Generate a curved arc between two points (for flight paths).
 * Creates a quadratic bezier with a midpoint offset perpendicular to the line.
 */
function generateArc(
    from: google.maps.LatLngLiteral,
    to: google.maps.LatLngLiteral,
    numPoints = 30
): google.maps.LatLngLiteral[] {
    const points: google.maps.LatLngLiteral[] = [];
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;

    // Perpendicular offset for arc curvature
    const dx = to.lng - from.lng;
    const dy = to.lat - from.lat;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = dist * 0.15; // 15% of distance as arc height

    const controlLat = midLat + (-dx / dist) * offset;
    const controlLng = midLng + (dy / dist) * offset;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat =
            (1 - t) * (1 - t) * from.lat +
            2 * (1 - t) * t * controlLat +
            t * t * to.lat;
        const lng =
            (1 - t) * (1 - t) * from.lng +
            2 * (1 - t) * t * controlLng +
            t * t * to.lng;
        points.push({ lat, lng });
    }

    return points;
}

export type { TravelSegment };
