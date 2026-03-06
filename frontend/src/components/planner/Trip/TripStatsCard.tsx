import { FC, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import clsx from 'clsx';
import type { TripResult } from '@/types';

interface TripStatsCardProps {
    result: TripResult;
}

const DISTANCE_COMPARISONS = [
    { distance: 1380, text: 'Delhi → Mumbai' },
    { distance: 2150, text: 'Delhi → Bangalore' },
    { distance: 300, text: 'Delhi → Jaipur' },
    { distance: 600, text: 'Mumbai → Goa' },
    { distance: 1000, text: 'Kolkata → Chennai' },
];

function getDistanceComparison(km: number): string {
    const sorted = [...DISTANCE_COMPARISONS].sort((a, b) => Math.abs(a.distance - km) - Math.abs(b.distance - km));
    const best = sorted[0];
    const ratio = km / best.distance;
    if (ratio >= 1.8) return `${best.text} × ${Math.round(ratio)}`;
    if (ratio >= 0.9) return `≈ ${best.text}`;
    return `${km} km`;
}

function getModeEmoji(mode?: string): string {
    if (!mode) return '🚗';
    const m = mode.toLowerCase();
    if (m.includes('train') || m.includes('rail')) return '🚂';
    if (m.includes('flight') || m.includes('air') || m.includes('fly')) return '✈️';
    if (m.includes('bus')) return '🚌';
    if (m.includes('cab') || m.includes('taxi')) return '🚕';
    if (m.includes('auto')) return '🛺';
    if (m.includes('walk')) return '🚶';
    return '🚗';
}

export const TripStatsCard: FC<TripStatsCardProps> = ({ result }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const cities = [...new Set(result.itinerary.map(d => d.city))];
    const totalDays = result.itinerary.length;
    const totalCost = result.summary.totalCost;
    const totalDistance = Math.round(result.summary.totalDistance);
    const { costBreakup } = result.summary;

    // Travel modes
    const modes = [...new Set(result.itinerary.map(d => d.travel?.mode).filter(Boolean) as string[])];

    // Donut chart segments
    const breakupEntries = [
        { label: 'Stay', value: costBreakup.stay, color: '#6366f1' },
        { label: 'Transport', value: costBreakup.transport, color: '#f43f5e' },
        { label: 'Activities', value: costBreakup.activities, color: '#10b981' },
        { label: 'Food', value: costBreakup.food, color: '#f59e0b' },
    ].filter(e => e.value > 0);

    const breakupTotal = breakupEntries.reduce((s, e) => s + e.value, 0);

    // SVG donut chart
    const donutRadius = 60;
    const donutStroke = 18;
    const circumference = 2 * Math.PI * donutRadius;
    let cumulativeOffset = 0;
    const donutSegments = breakupEntries.map(entry => {
        const pct = entry.value / breakupTotal;
        const dashArray = pct * circumference;
        const offset = cumulativeOffset;
        cumulativeOffset += dashArray;
        return { ...entry, dashArray, dashOffset: circumference - offset, pct };
    });

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#0f172a' });
            const link = document.createElement('a');
            link.download = 'trip-stats.png';
            link.href = dataUrl;
            link.click();
        } catch { toast.error('Failed to download image.'); }
        finally { setDownloading(false); }
    };

    return (
        <div className="space-y-4">
            {/* Card */}
            <div ref={cardRef} className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-black tracking-tight mb-1">📊 Trip Statistics</h3>
                    <p className="text-sm text-gray-400">{cities.join(' → ')}</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">📅</div>
                        <div className="text-2xl font-black">{totalDays}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400">Days</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">🏙️</div>
                        <div className="text-2xl font-black">{cities.length}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400">Cities</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">💰</div>
                        <div className="text-2xl font-black">₹{(totalCost / 1000).toFixed(0)}K</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400">Budget</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">🛣️</div>
                        <div className="text-2xl font-black">{totalDistance}</div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-400">Km</div>
                    </div>
                </div>

                {/* Distance comparison */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 text-center">
                    <p className="text-sm text-gray-300">
                        <span className="text-lg">🗺️</span> That's equivalent to <span className="font-bold text-yellow-400">{getDistanceComparison(totalDistance)}</span>!
                    </p>
                </div>

                {/* Cities as connected dots */}
                <div className="mb-6">
                    <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">
                        {cities.map((city, i) => (
                            <div key={city} className="flex items-center shrink-0">
                                <div className="flex flex-col items-center">
                                    <div className={clsx(
                                        'w-5 h-5 rounded-full border-2 border-blue-400',
                                        i === 0 ? 'bg-green-500' : i === cities.length - 1 ? 'bg-red-500' : 'bg-blue-500'
                                    )} />
                                    <span className="text-[10px] text-gray-400 mt-1 max-w-[70px] truncate text-center">{city}</span>
                                </div>
                                {i < cities.length - 1 && (
                                    <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mx-1 mt-[-14px]" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Donut chart */}
                    <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                        <svg width="140" height="140" viewBox="0 0 160 160" className="shrink-0">
                            {donutSegments.map((seg, i) => (
                                <circle
                                    key={i}
                                    cx="80" cy="80" r={donutRadius}
                                    fill="none"
                                    stroke={seg.color}
                                    strokeWidth={donutStroke}
                                    strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
                                    strokeDashoffset={seg.dashOffset}
                                    transform="rotate(-90 80 80)"
                                    className="transition-all duration-500"
                                />
                            ))}
                            <text x="80" y="76" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">₹{(breakupTotal / 1000).toFixed(0)}K</text>
                            <text x="80" y="94" textAnchor="middle" fill="#9ca3af" fontSize="10">Total</text>
                        </svg>
                        <div className="space-y-1.5 flex-1">
                            {donutSegments.map(seg => (
                                <div key={seg.label} className="flex items-center gap-2 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                                    <span className="text-gray-300 flex-1">{seg.label}</span>
                                    <span className="font-mono font-medium">{Math.round(seg.pct * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Travel modes & Duration */}
                    <div className="space-y-3">
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Travel Modes</div>
                            <div className="flex flex-wrap gap-2">
                                {modes.map(mode => (
                                    <span key={mode} className="bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                                        {getModeEmoji(mode)} {mode}
                                    </span>
                                ))}
                                {modes.length === 0 && <span className="text-xs text-gray-500">No travel info</span>}
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Duration</div>
                            <p className="text-lg font-bold flex items-center gap-2">
                                🌅 {totalDays} {totalDays === 1 ? 'Day' : 'Days'} · {totalDays > 0 ? totalDays - 1 : 0} {totalDays - 1 === 1 ? 'Night' : 'Nights'} 🌙
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-[10px] text-gray-500">
                    Trip Planner ✨ • Generated {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </div>
            </div>

            {/* Download button */}
            <div className="flex justify-center">
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-colors disabled:opacity-50"
                >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download Stats Card
                </button>
            </div>
        </div>
    );
};
