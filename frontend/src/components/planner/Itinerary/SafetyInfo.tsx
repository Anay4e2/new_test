import { FC, useState, useEffect } from 'react';
import { EmergencyInfo } from '@/types';
import { getSafetyInfo } from '@/services/api';
import { Shield, Phone, MapPin, AlertTriangle, ChevronDown, ChevronUp, Cross, Plane } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SafetyInfoProps {
    cities: string[];
}

export const SafetyInfo: FC<SafetyInfoProps> = ({ cities }) => {
    const [safetyData, setSafetyData] = useState<Record<string, EmergencyInfo>>({});
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeCity, setActiveCity] = useState<string>(cities[0] || '');

    useEffect(() => {
        const fetchSafety = async () => {
            setLoading(true);
            const results: Record<string, EmergencyInfo> = {};
            const uniqueCities = [...new Set(cities)];
            await Promise.all(
                uniqueCities.map(async (city) => {
                    try {
                        const data = await getSafetyInfo(city);
                        if (data) results[city] = data;
                    } catch { /* city not found — skip */ }
                })
            );
            setSafetyData(results);
            setLoading(false);
        };
        if (cities.length > 0) fetchSafety();
    }, [cities]);

    const availableCities = Object.keys(safetyData);
    const info = safetyData[activeCity];

    if (loading) return null;
    if (availableCities.length === 0) return null;

    // Ensure activeCity is valid
    if (!info && availableCities.length > 0) {
        setActiveCity(availableCities[0]);
        return null;
    }

    if (!info) return null;

    return (
        <div className="mt-6 mb-4">
            {/* Collapsible header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800/40 rounded-xl hover:shadow-md transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                        <Shield size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">🛡️ Safety & Emergency</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Emergency contacts, tips & warnings for {availableCities.length} {availableCities.length === 1 ? 'city' : 'cities'}
                        </p>
                    </div>
                </div>
                {isExpanded
                    ? <ChevronUp size={20} className="text-gray-500" />
                    : <ChevronDown size={20} className="text-gray-500" />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-4 space-y-4">
                            {/* City tabs */}
                            {availableCities.length > 1 && (
                                <div className="flex gap-2 flex-wrap">
                                    {availableCities.map((city) => (
                                        <button
                                            key={city}
                                            onClick={() => setActiveCity(city)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${activeCity === city
                                                    ? 'bg-red-600 text-white border-red-600'
                                                    : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Emergency numbers grid */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    Emergency Numbers
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: 'Police', number: '100', icon: '🚔', color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' },
                                        { label: 'Ambulance', number: info.ambulance, icon: '🚑', color: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' },
                                        { label: 'Fire', number: info.fire, icon: '🚒', color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800' },
                                        { label: 'Tourist Help', number: info.touristHelpline, icon: '📞', color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' },
                                        { label: 'Women Help', number: info.womenHelpline, icon: '👩', color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' },
                                        { label: info.police.station, number: info.police.number, icon: '🏛️', color: 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-700' },
                                    ].map((item) => (
                                        <a
                                            key={item.label}
                                            href={`tel:${item.number}`}
                                            className={`flex items-center gap-2 p-2.5 rounded-lg border ${item.color} hover:shadow-sm transition-all active:scale-95`}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{item.label}</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white">{item.number}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Hospitals */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Cross size={12} /> Nearest Hospitals
                                </h4>
                                <div className="space-y-2">
                                    {info.hospital.map((h, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                            <div className="mt-0.5 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs">🏥</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-white">{h.name}</p>
                                                    {h.hasEmergency && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full font-medium">24/7 ER</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin size={10} /> {h.address}
                                                </p>
                                                <a href={`tel:${h.number}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 mt-0.5 hover:underline">
                                                    <Phone size={10} /> {h.number}
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nearest Airport */}
                            <div className="flex items-center gap-2.5 p-2.5 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-200 dark:border-sky-800/40">
                                <Plane size={16} className="text-sky-600 dark:text-sky-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Nearest Airport</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-white">
                                        {info.nearestAirport.name} ({info.nearestAirport.code}) — {info.nearestAirport.distanceKm} km
                                    </p>
                                </div>
                            </div>

                            {/* Local Safety Tips */}
                            {info.localTips.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Shield size={12} /> Local Safety Tips
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {info.localTips.map((tip, i) => (
                                            <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Scam Warnings */}
                            {info.scamWarnings.length > 0 && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800/40">
                                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> Common Scams to Watch For
                                    </h4>
                                    <ul className="space-y-1.5">
                                        {info.scamWarnings.map((warning, i) => (
                                            <li key={i} className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                                                <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Safe Areas vs Areas to Avoid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {info.safeAreas.length > 0 && (
                                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/40">
                                        <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">✅ Safe Areas</h4>
                                        <ul className="space-y-1">
                                            {info.safeAreas.map((area, i) => (
                                                <li key={i} className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5">
                                                    <MapPin size={10} /> {area}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {info.areasToAvoidAtNight.length > 0 && (
                                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800/40">
                                        <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">🌙 Avoid at Night</h4>
                                        <ul className="space-y-1">
                                            {info.areasToAvoidAtNight.map((area, i) => (
                                                <li key={i} className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5">
                                                    <MapPin size={10} /> {area}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Embassies */}
                            {info.embassy && info.embassy.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">🏛️ Nearest Embassies</h4>
                                    <div className="space-y-1.5">
                                        {info.embassy.map((e, i) => (
                                            <div key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                                <span className="flex-shrink-0">🌐</span>
                                                <div>
                                                    <span className="font-medium">{e.country}:</span>{' '}
                                                    <a href={`tel:${e.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{e.phone}</a>
                                                    <span className="text-gray-400"> — {e.address}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
