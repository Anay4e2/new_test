import { FC, useEffect, useRef, useCallback } from 'react';

interface AnimatedMarkerProps {
    map: google.maps.Map | null;
    path: google.maps.LatLngLiteral[];
    cityWaypoints: { index: number; name: string }[];
    isPlaying: boolean;
    speed: number; // 1, 2, 5
    onProgress: (fraction: number) => void;
    onCityReached: (cityName: string) => void;
    onComplete: () => void;
}

const MARKER_SVG = (color: string) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2">
      <animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite"/>
    </circle>
    <circle cx="12" cy="12" r="4" fill="white">
      <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
    </circle>
  </svg>
`;

export const AnimatedMarker: FC<AnimatedMarkerProps> = ({
    map,
    path,
    cityWaypoints,
    isPlaying,
    speed,
    onProgress,
    onCityReached,
    onComplete,
}) => {
    const markerRef = useRef<google.maps.Marker | null>(null);
    const tooltipRef = useRef<google.maps.InfoWindow | null>(null);
    const progressRef = useRef(0); // 0..1 fraction along the entire path
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const reachedCitiesRef = useRef<Set<number>>(new Set());

    // Total path length calculation
    const pathLengthsRef = useRef<number[]>([]);
    const totalLengthRef = useRef(0);

    useEffect(() => {
        if (path.length < 2) return;

        // Pre-compute cumulative segment lengths
        const lengths: number[] = [0];
        let total = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].lng - path[i - 1].lng;
            const dy = path[i].lat - path[i - 1].lat;
            total += Math.sqrt(dx * dx + dy * dy);
            lengths.push(total);
        }
        pathLengthsRef.current = lengths;
        totalLengthRef.current = total;
    }, [path]);

    // Create / destroy marker
    useEffect(() => {
        if (!map || path.length < 2) return;

        const marker = new google.maps.Marker({
            map,
            position: path[0],
            icon: {
                url: `data:image/svg+xml,${encodeURIComponent(MARKER_SVG('%23ef4444'))}`,
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12),
            },
            zIndex: 999,
        });
        markerRef.current = marker;

        const tooltip = new google.maps.InfoWindow({ disableAutoPan: true });
        tooltipRef.current = tooltip;

        return () => {
            marker.setMap(null);
            tooltip.close();
            markerRef.current = null;
            tooltipRef.current = null;
        };
    }, [map, path]);

    // Interpolate position from progress fraction
    const getPositionAtFraction = useCallback((fraction: number): google.maps.LatLngLiteral => {
        if (path.length < 2) return path[0] || { lat: 0, lng: 0 };

        const targetDist = fraction * totalLengthRef.current;
        const lengths = pathLengthsRef.current;

        let segIdx = 0;
        for (let i = 1; i < lengths.length; i++) {
            if (lengths[i] >= targetDist) {
                segIdx = i - 1;
                break;
            }
            segIdx = i - 1;
        }

        const segStart = lengths[segIdx];
        const segEnd = lengths[segIdx + 1] || lengths[segIdx];
        const segLength = segEnd - segStart;
        const t = segLength > 0 ? (targetDist - segStart) / segLength : 0;

        return {
            lat: path[segIdx].lat + t * (path[segIdx + 1].lat - path[segIdx].lat),
            lng: path[segIdx].lng + t * (path[segIdx + 1].lng - path[segIdx].lng),
        };
    }, [path]);

    // Check if any city waypoint has been reached
    const checkCityWaypoints = useCallback((fraction: number) => {
        const targetDist = fraction * totalLengthRef.current;
        const lengths = pathLengthsRef.current;

        for (const wp of cityWaypoints) {
            if (wp.index < lengths.length && !reachedCitiesRef.current.has(wp.index)) {
                if (targetDist >= lengths[wp.index]) {
                    reachedCitiesRef.current.add(wp.index);
                    onCityReached(wp.name);

                    // Show tooltip briefly
                    if (tooltipRef.current && markerRef.current) {
                        tooltipRef.current.setContent(
                            `<div style="font-size:12px;font-weight:600;padding:2px 6px">${wp.name}</div>`
                        );
                        tooltipRef.current.open(map!, markerRef.current);
                        setTimeout(() => tooltipRef.current?.close(), 1500);
                    }
                }
            }
        }
    }, [cityWaypoints, map, onCityReached]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying || !markerRef.current || path.length < 2) {
            lastTimeRef.current = 0;
            return;
        }

        const animate = (timestamp: number) => {
            if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            // Speed: base duration ~10s for 1x
            const increment = (delta / 10000) * speed;
            progressRef.current = Math.min(1, progressRef.current + increment);

            const pos = getPositionAtFraction(progressRef.current);
            markerRef.current?.setPosition(pos);
            onProgress(progressRef.current);
            checkCityWaypoints(progressRef.current);

            if (progressRef.current >= 1) {
                onComplete();
                return;
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, speed, path, getPositionAtFraction, onProgress, onComplete, checkCityWaypoints]);

    // Reset progress when path changes
    useEffect(() => {
        progressRef.current = 0;
        reachedCitiesRef.current = new Set();
    }, [path]);

    // Hide marker when not playing and progress is 0
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.setVisible(isPlaying || progressRef.current > 0);
        }
    }, [isPlaying]);

    return null; // Rendered via Google Maps API directly
};
