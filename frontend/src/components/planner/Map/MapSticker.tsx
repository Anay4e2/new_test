import { FC, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2, Circle, Square } from 'lucide-react';
import { toPng } from 'html-to-image';
import clsx from 'clsx';
import type { TripResult } from '@/types';

interface MapStickerProps {
    result: TripResult;
}

type StickerShape = 'circle' | 'rectangle';

function getCityCoordinates(itinerary: TripResult['itinerary']): { name: string; lat: number; lng: number }[] {
    const seen = new Set<string>();
    const coords: { name: string; lat: number; lng: number }[] = [];

    for (const day of itinerary) {
        if (seen.has(day.city)) continue;
        seen.add(day.city);

        // Try to get coordinates from activities or travel
        let lat = 0, lng = 0;
        const acts = day.activities || [];
        for (const act of acts) {
            if (act.coordinates?.lat && act.coordinates?.lng) {
                lat = act.coordinates.lat;
                lng = act.coordinates.lng;
                break;
            }
            if (act.lat && act.lng) {
                lat = act.lat;
                lng = act.lng;
                break;
            }
        }

        // Fallback: estimate from city name using known Indian city coords
        if (!lat && !lng) {
            const known: Record<string, [number, number]> = {
                'delhi': [28.6139, 77.2090], 'new delhi': [28.6139, 77.2090],
                'mumbai': [19.0760, 72.8777], 'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946],
                'chennai': [13.0827, 80.2707], 'kolkata': [22.5726, 88.3639],
                'hyderabad': [17.3850, 78.4867], 'pune': [18.5204, 73.8567],
                'jaipur': [26.9124, 75.7873], 'jodhpur': [26.2389, 73.0243],
                'udaipur': [24.5854, 73.7125], 'agra': [27.1767, 78.0081],
                'varanasi': [25.3176, 82.9739], 'goa': [15.2993, 74.1240],
                'amritsar': [31.6340, 74.8723], 'shimla': [31.1048, 77.1734],
                'manali': [32.2396, 77.1887], 'rishikesh': [30.0869, 78.2676],
                'kochi': [9.9312, 76.2673], 'mysore': [12.2958, 76.6394], 'mysuru': [12.2958, 76.6394],
                'jaisalmer': [26.9157, 70.9083], 'pushkar': [26.4899, 74.5510],
                'darjeeling': [27.0410, 88.2663], 'gangtok': [27.3389, 88.6065],
                'leh': [34.1526, 77.5771], 'srinagar': [34.0837, 74.7973],
                'ooty': [11.4102, 76.6950], 'munnar': [10.0889, 77.0595],
                'alleppey': [9.4981, 76.3388], 'pondicherry': [11.9416, 79.8083],
                'bhopal': [23.2599, 77.4126], 'lucknow': [26.8467, 80.9462],
                'ahmedabad': [23.0225, 72.5714], 'surat': [21.1702, 72.8311],
                'indore': [22.7196, 75.8577], 'raipur': [21.2514, 81.6296],
                'ranchi': [23.3441, 85.3096], 'patna': [25.6093, 85.1376],
                'chandigarh': [30.7333, 76.7794], 'dehradun': [30.3165, 78.0322],
                'thiruvananthapuram': [8.5241, 76.9366], 'madurai': [9.9252, 78.1198],
                'visakhapatnam': [17.6868, 83.2185], 'coimbatore': [11.0168, 76.9558],
                'nagpur': [21.1458, 79.0882], 'guwahati': [26.1445, 91.7362],
                'mount abu': [24.5926, 72.7156], 'bikaner': [28.0229, 73.3119],
                'ajmer': [26.4499, 74.6399], 'khajuraho': [24.8318, 79.9199],
            };
            const key = day.city.toLowerCase().trim();
            if (known[key]) {
                [lat, lng] = known[key];
            }
        }

        if (lat && lng) {
            coords.push({ name: day.city, lat, lng });
        }
    }
    return coords;
}

export const MapSticker: FC<MapStickerProps> = ({ result }) => {
    const stickerRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [shape, setShape] = useState<StickerShape>('rectangle');

    const coords = getCityCoordinates(result.itinerary);
    const cities = [...new Set(result.itinerary.map(d => d.city))];

    if (coords.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400">
                <p className="text-sm">No coordinates available for this trip.</p>
            </div>
        );
    }

    // Bounding box
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Padding
    const padLat = Math.max((maxLat - minLat) * 0.25, 0.5);
    const padLng = Math.max((maxLng - minLng) * 0.25, 0.5);

    const mapMinLat = minLat - padLat;
    const mapMaxLat = maxLat + padLat;
    const mapMinLng = minLng - padLng;
    const mapMaxLng = maxLng + padLng;

    // Center for static map tile
    const centerLat = (mapMinLat + mapMaxLat) / 2;
    const centerLng = (mapMinLng + mapMaxLng) / 2;

    // Zoom calculation
    const latSpan = mapMaxLat - mapMinLat;
    const lngSpan = mapMaxLng - mapMinLng;
    const maxSpan = Math.max(latSpan, lngSpan);
    let zoom = 6;
    if (maxSpan < 1) zoom = 10;
    else if (maxSpan < 2) zoom = 8;
    else if (maxSpan < 5) zoom = 7;
    else if (maxSpan < 10) zoom = 6;
    else zoom = 5;

    // Static map tiles from OpenStreetMap (using static map service)
    const staticMapUrl = `https://maps.geoapify.com/v1/staticmap?style=dark-matter-brown&width=600&height=600&center=lonlat:${centerLng},${centerLat}&zoom=${zoom}&apiKey=demo`;
    // Fallback: simple gradient background if no API key
    const useStaticMap = false; // Set true if API key available

    // Convert coordinates to SVG positions
    const svgW = 400;
    const svgH = 400;
    const toSvg = (lat: number, lng: number) => ({
        x: ((lng - mapMinLng) / (mapMaxLng - mapMinLng)) * svgW,
        y: ((mapMaxLat - lat) / (mapMaxLat - mapMinLat)) * svgH,
    });

    const svgCoords = coords.map(c => ({ ...c, ...toSvg(c.lat, c.lng) }));

    // Polyline path
    const pathD = svgCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

    const handleDownload = async () => {
        if (!stickerRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(stickerRef.current, {
                pixelRatio: 2,
                backgroundColor: shape === 'circle' ? undefined : '#1a1a2e',
            });
            const link = document.createElement('a');
            link.download = `trip-map-sticker.png`;
            link.href = dataUrl;
            link.click();
        } catch { toast.error('Failed to download sticker.'); }
        finally { setDownloading(false); }
    };

    const stateName = cities.length > 0 ? cities[0].split(',')[0] : 'India';

    return (
        <div className="space-y-4">
            {/* Shape selector */}
            <div className="flex justify-center gap-2 mb-2">
                <button onClick={() => setShape('rectangle')} className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', shape === 'rectangle' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400')}>
                    <Square size={12} /> Rectangle
                </button>
                <button onClick={() => setShape('circle')} className={clsx('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', shape === 'circle' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400')}>
                    <Circle size={12} /> Circle
                </button>
            </div>

            {/* Sticker */}
            <div className="flex justify-center">
                <div
                    ref={stickerRef}
                    className={clsx(
                        'relative overflow-hidden',
                        shape === 'circle' ? 'rounded-full w-[350px] h-[350px]' : 'rounded-2xl w-[400px] h-[400px]'
                    )}
                    style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
                >
                    {/* Static map background */}
                    {useStaticMap && (
                        <img src={staticMapUrl} alt="Map" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}

                    {/* Grid overlay */}
                    <svg className="absolute inset-0 w-full h-full opacity-10">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <g key={i}>
                                <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#fff" strokeWidth="0.5" />
                                <line x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="#fff" strokeWidth="0.5" />
                            </g>
                        ))}
                    </svg>

                    {/* Route SVG */}
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="absolute inset-0 w-full h-full">
                        {/* Glow under route */}
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>

                        {/* Route line */}
                        <path d={pathD} fill="none" stroke="url(#routeGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                        <path d={pathD} fill="none" stroke="url(#routeGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 4" />

                        {/* City dots */}
                        {svgCoords.map((c, i) => (
                            <g key={c.name}>
                                <circle cx={c.x} cy={c.y} r="12" fill="rgba(99,102,241,0.3)" />
                                <circle cx={c.x} cy={c.y} r="6" fill={i === 0 ? '#10b981' : i === svgCoords.length - 1 ? '#ef4444' : '#6366f1'} stroke="#fff" strokeWidth="2" />
                                <text
                                    x={c.x}
                                    y={c.y - 18}
                                    textAnchor="middle"
                                    fill="#e2e8f0"
                                    fontSize="13"
                                    fontWeight="bold"
                                    fontFamily="Inter, system-ui, sans-serif"
                                >
                                    {c.name}
                                </text>
                            </g>
                        ))}
                    </svg>

                    {/* Text overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
                        <p className="text-white text-lg font-black tracking-tight">
                            I traveled through {stateName}! ✨
                        </p>
                        <p className="text-gray-300 text-xs mt-0.5">
                            {cities.length} cities · {Math.round(result.summary.totalDistance)} km
                        </p>
                    </div>

                    {/* Compass */}
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">
                        N
                    </div>
                </div>
            </div>

            {/* Download */}
            <div className="flex justify-center">
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download Sticker
                </button>
            </div>
        </div>
    );
};
