import { FC } from 'react';
import { Layers } from 'lucide-react';

interface MapLegendProps {
    visibleModes: Set<string>;
    onToggleMode: (mode: string) => void;
    showActivities: boolean;
    onToggleActivities: () => void;
    showHotels: boolean;
    onToggleHotels: () => void;
}

const LEGEND_ITEMS = [
    { key: 'train', label: 'Train', color: '#ef4444', icon: '🚆' },
    { key: 'road', label: 'Road / Bus', color: '#3b82f6', icon: '🚗' },
    { key: 'flight', label: 'Flight', color: '#22c55e', icon: '✈️' },
];

const MARKER_ITEMS = [
    { key: 'activities', label: 'Activities', icon: '⭐' },
    { key: 'hotels', label: 'Hotels', icon: '🏨' },
];

export const MapLegend: FC<MapLegendProps> = ({
    visibleModes,
    onToggleMode,
    showActivities,
    onToggleActivities,
    showHotels,
    onToggleHotels,
}) => {
    return (
        <div className="absolute top-4 right-4 z-[1000] bg-black/70 backdrop-blur-xl rounded-xl border border-white/15 shadow-2xl p-3 min-w-[160px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <Layers size={14} className="text-white/60" />
                <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Legend</span>
            </div>

            {/* Transport modes */}
            <div className="space-y-1.5">
                {LEGEND_ITEMS.map(item => {
                    const isActive = visibleModes.has(item.key);
                    return (
                        <button
                            key={item.key}
                            onClick={() => onToggleMode(item.key)}
                            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-all ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/30 hover:text-white/50'
                                }`}
                        >
                            <span className="text-sm">{item.icon}</span>
                            <div
                                className="w-5 h-1 rounded-full"
                                style={{
                                    backgroundColor: isActive ? item.color : '#666',
                                    opacity: isActive ? 1 : 0.3,
                                }}
                            />
                            <span className="flex-1 text-left">{item.label}</span>
                            {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Separator */}
            <div className="my-2 border-t border-white/10" />

            {/* Marker types */}
            <div className="space-y-1.5">
                {MARKER_ITEMS.map(item => {
                    const isActive = item.key === 'activities' ? showActivities : showHotels;
                    const toggle = item.key === 'activities' ? onToggleActivities : onToggleHotels;
                    return (
                        <button
                            key={item.key}
                            onClick={toggle}
                            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-all ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/30 hover:text-white/50'
                                }`}
                        >
                            <span className="text-sm">{item.icon}</span>
                            <span className="flex-1 text-left">{item.label}</span>
                            {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
