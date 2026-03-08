import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSafetyInfo, getCities } from '@/services/api';
import type { EmergencyInfo, City } from '@/types';
import { ArrowLeft, Shield, Phone, MapPin, AlertTriangle, Hospital, Plane, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Safety: FC = () => {
    const navigate = useNavigate();
    const [safetyMap, setSafetyMap] = useState<Record<string, EmergencyInfo>>({});
    const [, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCity, setExpandedCity] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        Promise.all([
            getAllSafetyInfo().catch(() => ({} as Record<string, EmergencyInfo>)),
            getCities().catch(() => [] as City[]),
        ]).then(([safety, cityList]) => {
            setSafetyMap(safety);
            setCities(cityList);
            const firstKey = Object.keys(safety)[0];
            if (firstKey) setExpandedCity(firstKey);
        }).finally(() => setLoading(false));
    }, []);

    const filteredCities = Object.keys(safetyMap).filter(city =>
        city.toLowerCase().includes(search.toLowerCase())
    );

    const renderInfoCard = (info: EmergencyInfo) => (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
        >
            <div className="p-5 space-y-5">
                {/* Emergency Numbers */}
                <div>
                    <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                        <Phone size={14} /> Emergency Numbers
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                            { label: 'Police', value: info.police.number },
                            { label: 'Ambulance', value: info.ambulance },
                            { label: 'Fire', value: info.fire },
                            { label: 'Tourist Helpline', value: info.touristHelpline },
                            { label: 'Women Helpline', value: info.womenHelpline },
                        ].map(item => (
                            <div key={item.label} className="bg-red-50 dark:bg-red-900/10 rounded-lg p-2.5 border border-red-100 dark:border-red-900/30">
                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">{item.label}</p>
                                <a href={`tel:${item.value}`} className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline">{item.value}</a>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hospitals */}
                {info.hospital.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                            <Hospital size={14} /> Hospitals
                        </h4>
                        <div className="space-y-2">
                            {info.hospital.map((h, i) => (
                                <div key={i} className="flex items-start justify-between gap-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-900/30">
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{h.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{h.address}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <a href={`tel:${h.number}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">{h.number}</a>
                                        {h.hasEmergency && <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">24/7 Emergency</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Police Station */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 border border-gray-100 dark:border-slate-600">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Police Station</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{info.police.station}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{info.police.address}</p>
                </div>

                {/* Airport */}
                <div className="flex items-center gap-3 bg-sky-50 dark:bg-sky-900/10 rounded-lg p-3 border border-sky-100 dark:border-sky-900/30">
                    <Plane size={16} className="text-sky-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{info.nearestAirport.name} ({info.nearestAirport.code})</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{info.nearestAirport.distanceKm} km from city centre</p>
                    </div>
                </div>

                {/* Safe Areas & Areas to Avoid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {info.safeAreas.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">✅ Safe Areas</h4>
                            <ul className="space-y-1">
                                {info.safeAreas.map((area, i) => (
                                    <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                                        <MapPin size={10} className="text-green-500 mt-0.5 shrink-0" /> {area}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {info.areasToAvoidAtNight.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">⚠️ Avoid at Night</h4>
                            <ul className="space-y-1">
                                {info.areasToAvoidAtNight.map((area, i) => (
                                    <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                                        <AlertTriangle size={10} className="text-red-500 mt-0.5 shrink-0" /> {area}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Local Tips */}
                {info.localTips.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">💡 Local Tips</h4>
                        <ul className="space-y-1.5">
                            {info.localTips.map((tip, i) => (
                                <li key={i} className="text-xs text-gray-600 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/10 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Scam Warnings */}
                {info.scamWarnings.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">🚨 Scam Warnings</h4>
                        <ul className="space-y-1.5">
                            {info.scamWarnings.map((scam, i) => (
                                <li key={i} className="text-xs text-gray-600 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/10 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/20">
                                    {scam}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Embassies */}
                {info.embassy && info.embassy.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">🏛️ Embassies / Consulates</h4>
                        <div className="space-y-2">
                            {info.embassy.map((e, i) => (
                                <div key={i} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2.5 border border-gray-100 dark:border-slate-600">
                                    <p className="text-xs font-medium text-slate-800 dark:text-white">{e.country}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{e.address}</p>
                                    <a href={`tel:${e.phone}`} className="text-xs text-blue-600 dark:text-blue-400">{e.phone}</a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
                        <Shield size={16} /> Travel Safety
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">Safety & Emergency Info</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        Emergency contacts, hospitals, local tips and scam warnings for every city
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search city..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        aria-label="Search city"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-red-500" />
                    </div>
                ) : filteredCities.length === 0 ? (
                    <p className="text-center text-gray-400 py-12">No safety info available{search && ` for "${search}"`}</p>
                ) : (
                    <div className="space-y-3">
                        {filteredCities.map(city => {
                            const info = safetyMap[city];
                            const isOpen = expandedCity === city;
                            return (
                                <div key={city} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setExpandedCity(isOpen ? null : city)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                                <Shield size={16} className="text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{city}</h3>
                                                <p className="text-xs text-gray-400">
                                                    {info.hospital.length} hospital{info.hospital.length !== 1 ? 's' : ''} &middot; {info.scamWarnings.length} warning{info.scamWarnings.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                    </button>
                                    <AnimatePresence>
                                        {isOpen && renderInfoCard(info)}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Universal Numbers */}
                <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">🇮🇳 Universal Emergency Numbers (India)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {[
                            { label: 'Emergency', number: '112' },
                            { label: 'Police', number: '100' },
                            { label: 'Ambulance', number: '108' },
                            { label: 'Women Helpline', number: '1091' },
                        ].map(item => (
                            <a key={item.label} href={`tel:${item.number}`} className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center hover:shadow-md transition-shadow border border-red-100 dark:border-red-900/30">
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{item.label}</p>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">{item.number}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
