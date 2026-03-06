import { FC, useState, useEffect } from 'react';
import { Train, Bus, Plane, Car, Clock, IndianRupee, Armchair, Check } from 'lucide-react';
import clsx from 'clsx';
import { getTransportOptions } from '../../../services/api';

interface TransportOption {
    mode: string;
    duration: number;
    estimatedCost: { min: number; max: number };
    comfort: string;
    frequency?: string;
    bestDepartureTime?: string;
}

interface RouteVariantSelectorProps {
    from: string;
    to: string;
    selectedMode?: string;
    onSelect: (option: TransportOption) => void;
}

const modeIcon: Record<string, FC<{ size?: number; className?: string }>> = {
    train: Train,
    bus: Bus,
    flight: Plane,
    road: Car,
};

const modeLabel: Record<string, string> = {
    road: 'Cab / Car',
    bus: 'Bus',
    train: 'Train',
    flight: 'Flight',
};

const comfortBadge: Record<string, { label: string; color: string }> = {
    budget: { label: 'Budget', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    standard: { label: 'Standard', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    premium: { label: 'Premium', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};

function formatDuration(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatCost(cost: { min: number; max: number }): string {
    return `₹${cost.min.toLocaleString('en-IN')}–₹${cost.max.toLocaleString('en-IN')}`;
}

export const RouteVariantSelector: FC<RouteVariantSelectorProps> = ({ from, to, selectedMode, onSelect }) => {
    const [options, setOptions] = useState<TransportOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getTransportOptions(from, to)
            .then(data => {
                if (cancelled) return;
                setOptions(data.transportOptions || []);
                setDistance(data.distance ?? null);
            })
            .catch(() => {
                if (!cancelled) setOptions([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [from, to]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400" />
                Loading transport options…
            </div>
        );
    }

    if (options.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {from} → {to}
                    {distance != null && <span className="ml-1 text-gray-400">({distance} km)</span>}
                </span>
            </div>
            <div className="grid gap-2">
                {options.map(opt => {
                    const Icon = modeIcon[opt.mode] || Car;
                    const badge = comfortBadge[opt.comfort] || comfortBadge.standard;
                    const isSelected = selectedMode === opt.mode;

                    return (
                        <button
                            key={opt.mode}
                            onClick={() => onSelect(opt)}
                            className={clsx(
                                'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                                isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800'
                            )}
                        >
                            <div className={clsx(
                                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                            )}>
                                <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                                        {modeLabel[opt.mode] || opt.mode}
                                    </span>
                                    <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full font-medium', badge.color)}>
                                        {badge.label}
                                    </span>
                                    {isSelected && <Check size={14} className="text-blue-500 ml-auto shrink-0" />}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-0.5"><Clock size={10} /> {formatDuration(opt.duration)}</span>
                                    <span className="flex items-center gap-0.5"><IndianRupee size={10} /> {formatCost(opt.estimatedCost)}</span>
                                    {opt.frequency && <span className="flex items-center gap-0.5"><Armchair size={10} /> {opt.frequency}</span>}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
