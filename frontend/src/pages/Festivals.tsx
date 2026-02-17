import { FC, useState, useEffect, useMemo } from 'react';
import { Festival } from '@/types';
import { getAllFestivals } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Filter, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
    religious: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', icon: '🟠', label: 'Religious' },
    cultural: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', icon: '🔵', label: 'Cultural' },
    fair: { color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', icon: '🟢', label: 'Fair' },
    music: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', icon: '🟣', label: 'Music' },
    food: { color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: '🔴', label: 'Food' },
    art: { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400', icon: '🎨', label: 'Art' },
};

const STATE_LABELS: Record<string, string> = {
    RAJASTHAN: 'Rajasthan',
    UTTAR_PRADESH: 'Uttar Pradesh',
    GUJARAT: 'Gujarat',
    KERALA: 'Kerala',
    MADHYA_PRADESH: 'Madhya Pradesh',
};

const CROWD_DOTS: Record<string, number> = { extreme: 4, high: 3, moderate: 2, low: 1 };

export const Festivals: FC = () => {
    const [festivals, setFestivals] = useState<Festival[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const navigate = useNavigate();
    const currentMonth = new Date().getMonth() + 1;

    useEffect(() => {
        getAllFestivals().then(setFestivals).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const states = useMemo(() => [...new Set(festivals.map(f => f.stateCode))], [festivals]);
    const types = useMemo(() => [...new Set(festivals.map(f => f.type))], [festivals]);

    const filtered = useMemo(() => {
        return festivals.filter(f => {
            if (selectedMonth !== null && f.month !== selectedMonth) return false;
            if (selectedState && f.stateCode !== selectedState) return false;
            if (selectedType && f.type !== selectedType) return false;
            return true;
        });
    }, [festivals, selectedMonth, selectedState, selectedType]);

    const groupedByMonth = useMemo(() => {
        const map: Record<number, Festival[]> = {};
        filtered.forEach(f => {
            if (!map[f.month]) map[f.month] = [];
            map[f.month].push(f);
        });
        // Sort months starting from current month
        const sortedMonths = Object.keys(map).map(Number).sort((a, b) => {
            const aOff = (a - currentMonth + 12) % 12;
            const bOff = (b - currentMonth + 12) % 12;
            return aOff - bOff;
        });
        return sortedMonths.map(m => ({ month: m, festivals: map[m] }));
    }, [filtered, currentMonth]);

    const handlePlanTrip = (festival: Festival) => {
        const stateParam = festival.stateCode.toLowerCase().replace('_', '-');
        navigate(`/plan?state=${stateParam}&tab=smart`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1575359199241-12e31cbcb0f7?w=1920&h=400&fit=crop')] bg-cover bg-center opacity-20" />
                <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={20} className="text-yellow-300" />
                            <span className="text-sm font-medium text-white/80 uppercase tracking-wider">Discover India's Vibrant</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-serif">Festivals & Events</h1>
                        <p className="mt-3 text-lg text-white/80 max-w-2xl">Explore 30+ festivals across Rajasthan, Gujarat, Uttar Pradesh, Kerala & Madhya Pradesh. Plan your trip around India's most spectacular celebrations.</p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Filter Bar */}
                <div className="mb-8">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:shadow-md transition-all md:hidden"
                    >
                        <Filter size={16} /> Filters
                        <ChevronDown size={14} className={clsx('transition-transform', showFilters && 'rotate-180')} />
                    </button>

                    <div className={clsx('mt-4 md:mt-0 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4', !showFilters && 'hidden md:flex')}>
                        {/* Month pills */}
                        <div className="flex-1">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedMonth(null)}
                                    className={clsx('px-3 py-1.5 rounded-full text-xs font-medium transition-all', selectedMonth === null ? 'bg-orange-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-orange-300')}
                                >
                                    All Months
                                </button>
                                {MONTHS.map((m, i) => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedMonth(selectedMonth === i + 1 ? null : i + 1)}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                            selectedMonth === i + 1 ? 'bg-orange-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:border-orange-300',
                                            i + 1 === currentMonth && selectedMonth !== i + 1 && 'ring-2 ring-orange-200 dark:ring-orange-800'
                                        )}
                                    >
                                        {m.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* State filter */}
                        <select
                            value={selectedState || ''}
                            onChange={e => setSelectedState(e.target.value || null)}
                            className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-400 outline-none"
                        >
                            <option value="">All States</option>
                            {states.map(s => (
                                <option key={s} value={s}>{STATE_LABELS[s] || s}</option>
                            ))}
                        </select>

                        {/* Type filter */}
                        <select
                            value={selectedType || ''}
                            onChange={e => setSelectedType(e.target.value || null)}
                            className="px-3 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-orange-400 outline-none"
                        >
                            <option value="">All Types</option>
                            {types.map(t => (
                                <option key={t} value={t}>{TYPE_CONFIG[t]?.label || t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                    </div>
                ) : groupedByMonth.length === 0 ? (
                    <div className="text-center py-20">
                        <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No festivals match your filters.</p>
                        <button onClick={() => { setSelectedMonth(null); setSelectedState(null); setSelectedType(null); }} className="mt-3 text-orange-600 font-medium text-sm hover:underline">Clear all filters</button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groupedByMonth.map(({ month, festivals: monthFestivals }) => (
                            <motion.section key={month} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * (month % 12) }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm', month === currentMonth ? 'bg-gradient-to-br from-orange-500 to-pink-600' : 'bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700')}>
                                        {MONTHS[month - 1].slice(0, 3).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif">{MONTHS[month - 1]}</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{monthFestivals.length} festival{monthFestivals.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    {month === currentMonth && <span className="ml-2 px-2.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full uppercase">This Month</span>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {monthFestivals.map(festival => {
                                        const tc = TYPE_CONFIG[festival.type] || TYPE_CONFIG.cultural;
                                        const dots = CROWD_DOTS[festival.crowdLevel] || 2;
                                        const isExpanded = expandedId === festival._id;

                                        return (
                                            <motion.div
                                                key={festival._id}
                                                layout
                                                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                                            >
                                                {/* Image */}
                                                <div className="relative h-40 overflow-hidden">
                                                    <img
                                                        src={festival.imageUrl || `https://picsum.photos/seed/${festival._id}/600/300`}
                                                        alt={festival.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                    <div className="absolute bottom-3 left-3 right-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', tc.color)}>{tc.icon} {tc.label}</span>
                                                            {festival.impact === 'must-see' && (
                                                                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-yellow-400/90 text-yellow-900">⭐ Must-See</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-4">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{festival.name}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1"><MapPin size={12} /> {festival.cityName === 'all' ? (STATE_LABELS[festival.stateCode] || festival.stateCode) + ' (state-wide)' : festival.cityName}</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {festival.duration} day{festival.duration !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    {festival.approximateDate && (
                                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1.5 flex items-center gap-1"><Calendar size={12} /> {festival.approximateDate}</p>
                                                    )}

                                                    {/* Crowd indicator */}
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users size={12} /> Crowd:</span>
                                                        <span className="inline-flex gap-0.5">
                                                            {Array.from({ length: 4 }, (_, i) => (
                                                                <span key={i} className={clsx('w-2 h-2 rounded-full', i < dots ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-600')} />
                                                            ))}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{festival.crowdLevel}</span>
                                                    </div>

                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-2">{festival.description}</p>

                                                    {/* Expand/Collapse */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-2">
                                                                    {festival.highlights.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {festival.highlights.map((h, i) => (
                                                                                <span key={i} className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300">✦ {h}</span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {festival.travelAdvisory && (
                                                                        <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                                                                            <span className="shrink-0">⚠️</span>
                                                                            <span>{festival.travelAdvisory}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    <div className="flex items-center justify-between mt-4">
                                                        <button
                                                            onClick={() => setExpandedId(isExpanded ? null : festival._id)}
                                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                                                        >
                                                            {isExpanded ? 'Show less' : 'Details →'}
                                                        </button>
                                                        <button
                                                            onClick={() => handlePlanTrip(festival)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xs font-semibold rounded-lg hover:shadow-md hover:scale-105 transition-all"
                                                        >
                                                            Plan a Trip <ArrowRight size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
