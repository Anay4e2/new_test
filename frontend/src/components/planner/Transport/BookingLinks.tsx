import { FC, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ExternalLink, ChevronDown, ChevronUp, Calendar, AlertCircle, Train, Bus, Plane, Car } from 'lucide-react';
import { getBookingLinks } from '../../../services/api';
import type { BookingLink } from '../../../types';

interface BookingLinksProps {
    from: string;
    to: string;
    dayNumber: number;
    mode: string;
    distance?: number;
    startDate?: string | null;
}

const MODE_TABS = [
    { key: 'all', label: 'All', icon: MapPin },
    { key: 'train', label: 'Train', icon: Train },
    { key: 'bus', label: 'Bus', icon: Bus },
    { key: 'flight', label: 'Flight', icon: Plane },
    { key: 'cab', label: 'Cab', icon: Car },
];

export const BookingLinks: FC<BookingLinksProps> = ({ from, to, dayNumber, distance, startDate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [links, setLinks] = useState<BookingLink[]>([]);
    const [disclaimer, setDisclaimer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeMode, setActiveMode] = useState('all');
    const [dateInput, setDateInput] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Calculate the actual travel date from startDate + day offset
    const travelDate = useMemo(() => {
        if (startDate) {
            const base = new Date(startDate);
            base.setDate(base.getDate() + (dayNumber - 1));
            return base.toISOString().split('T')[0];
        }
        return dateInput || '';
    }, [startDate, dayNumber, dateInput]);

    const fetchLinks = async (date: string) => {
        setIsLoading(true);
        try {
            const result = await getBookingLinks(from, to, date, 'all', distance);
            setLinks(result.links);
            setDisclaimer(result.disclaimer);
        } catch (err) {
            console.error('Failed to fetch booking links:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isExpanded && travelDate) {
            fetchLinks(travelDate);
        }
    }, [isExpanded, travelDate]);

    const handleExpand = () => {
        if (!isExpanded && !travelDate) {
            setShowDatePicker(true);
            setIsExpanded(true);
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    const handleDateSubmit = () => {
        if (dateInput) {
            setShowDatePicker(false);
            fetchLinks(dateInput);
        }
    };

    const filteredLinks = useMemo(() => {
        if (activeMode === 'all') return links;
        return links.filter(l => l.mode === activeMode);
    }, [links, activeMode]);

    // Compact view: top 2 providers
    const topLinks = links.slice(0, 2);

    // Available modes for tabs
    const availableModes = useMemo(() => {
        const modes = new Set(links.map(l => l.mode));
        return MODE_TABS.filter(t => t.key === 'all' || modes.has(t.key));
    }, [links]);

    return (
        <div className="mt-3 border border-blue-100 dark:border-slate-600 rounded-xl overflow-hidden">
            {/* Header / Toggle */}
            <button
                onClick={handleExpand}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-slate-700/60 dark:to-slate-700/40 hover:from-blue-100 hover:to-sky-100 dark:hover:from-slate-700 dark:hover:to-slate-600/60 transition-all"
            >
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Book Transport
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {from} → {to}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Compact inline: top 2 providers */}
                    {!isExpanded && topLinks.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5">
                            {topLinks.map((link, i) => (
                                <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-600 rounded-full text-xs text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-500 border border-gray-200 dark:border-slate-500 transition-colors"
                                >
                                    <span>{link.logo}</span>
                                    <span className="font-medium">{link.provider}</span>
                                    <ExternalLink size={10} />
                                </a>
                            ))}
                        </div>
                    )}
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 bg-white dark:bg-slate-800 space-y-3">
                            {/* Date picker if no start date */}
                            {showDatePicker && !travelDate && (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                                    <Calendar size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span className="text-xs text-amber-700 dark:text-amber-300">Set travel date:</span>
                                    <input
                                        type="date"
                                        value={dateInput}
                                        onChange={(e) => setDateInput(e.target.value)}
                                        className="flex-1 text-xs px-2 py-1 rounded-md border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                                    />
                                    <button
                                        onClick={handleDateSubmit}
                                        disabled={!dateInput}
                                        className="px-3 py-1 text-xs font-medium bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-40 transition-colors"
                                    >
                                        Go
                                    </button>
                                </div>
                            )}

                            {/* Mode tabs */}
                            {links.length > 0 && (
                                <div className="flex gap-1 overflow-x-auto">
                                    {availableModes.map(tab => {
                                        const Icon = tab.icon;
                                        return (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveMode(tab.key)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${activeMode === tab.key
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                <Icon size={12} />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Loading state */}
                            {isLoading && (
                                <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Loading booking options...</span>
                                </div>
                            )}

                            {/* Link cards */}
                            {!isLoading && filteredLinks.length > 0 && (
                                <div className="space-y-2">
                                    {filteredLinks.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-slate-600/50 hover:border-blue-200 dark:hover:border-blue-500/40 transition-all group"
                                        >
                                            <span className="text-xl w-8 text-center">{link.logo}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-gray-800 dark:text-white">{link.provider}</div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">{link.mode}</div>
                                            </div>
                                            {link.estimatedPrice && (
                                                <div className="text-right shrink-0">
                                                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        ₹{link.estimatedPrice.min.toLocaleString()} – ₹{link.estimatedPrice.max.toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">est.</div>
                                                </div>
                                            )}
                                            <ExternalLink size={14} className="text-gray-300 dark:text-gray-500 group-hover:text-blue-500 transition-colors shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* No links state */}
                            {!isLoading && filteredLinks.length === 0 && links.length > 0 && (
                                <div className="text-xs text-center text-gray-400 dark:text-gray-500 py-3">
                                    No {activeMode} options available for this route.
                                </div>
                            )}

                            {/* Disclaimer */}
                            {disclaimer && links.length > 0 && (
                                <div className="flex items-start gap-1.5 text-[10px] text-gray-400 dark:text-gray-500 pt-1">
                                    <AlertCircle size={10} className="shrink-0 mt-0.5" />
                                    <span>{disclaimer}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
