import { FC, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    getTrainsBetweenCities,
    getTrainLiveStatus,
    checkPNRStatus,
    searchStation,
    getLiveStationBoard,
    getTrainSchedule,
    getTrainFare,
} from '../services/api';
import {
    Train, Search, ArrowRight, Clock, MapPin, ArrowLeft,
    Loader2, AlertCircle, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'search' | 'pnr' | 'status' | 'station';

const TABS: { id: Tab; label: string; icon: FC<any> }[] = [
    { id: 'search', label: 'Search Trains', icon: Search },
    { id: 'pnr', label: 'PNR Status', icon: Info },
    { id: 'status', label: 'Train Status', icon: Clock },
    { id: 'station', label: 'Live Station', icon: MapPin },
];

export const Trains: FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('search');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Train size={16} className="text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Indian Railways</h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-xl p-1 mb-6 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center',
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeTab === 'search' && <TrainSearch />}
                        {activeTab === 'pnr' && <PNRCheck />}
                        {activeTab === 'status' && <TrainStatusCheck />}
                        {activeTab === 'station' && <LiveStationBoard />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// ====== Search Trains Tab ======
const TrainSearch: FC = () => {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [expandedTrain, setExpandedTrain] = useState<string | null>(null);
    const [scheduleData, setScheduleData] = useState<Record<string, any>>({});
    const [fareData, setFareData] = useState<Record<string, any>>({});

    const handleSearch = async (e: FormEvent) => {
        e.preventDefault();
        if (!from.trim() || !to.trim()) return;
        setLoading(true);
        setResults(null);
        try {
            const data = await getTrainsBetweenCities(from.trim(), to.trim(), date || undefined);
            setResults(data);
        } catch {
            toast.error('Failed to search trains');
        } finally {
            setLoading(false);
        }
    };

    const loadSchedule = async (trainNumber: string) => {
        if (scheduleData[trainNumber]) return;
        try {
            const data = await getTrainSchedule(trainNumber);
            setScheduleData(prev => ({ ...prev, [trainNumber]: data }));
        } catch {
            toast.error('Failed to load schedule');
        }
    };

    const loadFare = async (trainNumber: string, fromCode: string, toCode: string) => {
        const key = `${trainNumber}-${fromCode}-${toCode}`;
        if (fareData[key]) return;
        try {
            const data = await getTrainFare(trainNumber, fromCode, toCode);
            setFareData(prev => ({ ...prev, [key]: data }));
        } catch {
            toast.error('Failed to load fare');
        }
    };

    const toggleTrain = (trainNumber: string, fromCode: string, toCode: string) => {
        if (expandedTrain === trainNumber) {
            setExpandedTrain(null);
        } else {
            setExpandedTrain(trainNumber);
            loadSchedule(trainNumber);
            loadFare(trainNumber, fromCode, toCode);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">From</label>
                        <input
                            value={from} onChange={e => setFrom(e.target.value)} placeholder="e.g. Delhi, Jaipur"
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">To</label>
                        <input
                            value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. Mumbai, Udaipur"
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Date (optional)</label>
                        <input
                            type="date" value={date} onChange={e => setDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    {loading ? 'Searching...' : 'Find Trains'}
                </button>
            </form>

            {results && (
                <div className="space-y-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {results.totalTrains} train{results.totalTrains !== 1 ? 's' : ''} found: <span className="font-medium text-gray-700 dark:text-gray-300">{results.fromStation}</span> → <span className="font-medium text-gray-700 dark:text-gray-300">{results.toStation}</span>
                    </div>
                    {results.trains?.map((train: any) => {
                        const isExpanded = expandedTrain === train.trainNumber;
                        const fareKey = `${train.trainNumber}-${results.fromCode}-${results.toCode}`;
                        return (
                            <div key={train.trainNumber} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
                                <button onClick={() => toggleTrain(train.trainNumber, results.fromCode, results.toCode)} className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{train.trainNumber}</span>
                                                <span className="font-semibold text-slate-800 dark:text-white text-sm">{train.trainName}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-medium text-slate-700 dark:text-gray-300">{train.departureTime}</span>
                                                <ArrowRight size={12} />
                                                <span className="font-medium text-slate-700 dark:text-gray-300">{train.arrivalTime}</span>
                                                <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{train.duration}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1 flex-wrap">
                                                {train.classes?.map((cls: string) => (
                                                    <span key={cls} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-medium">{cls}</span>
                                                ))}
                                            </div>
                                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex gap-1 flex-wrap">
                                        {train.daysOfOperation?.map((day: string) => (
                                            <span key={day} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 rounded">{day}</span>
                                        ))}
                                    </div>
                                </button>
                                {isExpanded && (
                                    <div className="border-t border-gray-100 dark:border-slate-700 p-4 space-y-4 bg-gray-50/50 dark:bg-slate-800/50">
                                        {/* Schedule */}
                                        {scheduleData[train.trainNumber]?.schedule && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Schedule</h4>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {scheduleData[train.trainNumber].schedule.map((stop: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-3 text-xs py-1">
                                                            <span className="w-10 text-gray-400 font-mono">{stop.stationCode}</span>
                                                            <span className="flex-1 text-slate-700 dark:text-gray-300">{stop.station}</span>
                                                            <span className="text-gray-500">{stop.arrival || '—'}</span>
                                                            <span className="text-gray-500">{stop.departure || '—'}</span>
                                                            {stop.platform && <span className="text-blue-500">P{stop.platform}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Fare */}
                                        {fareData[fareKey]?.fare && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Fare</h4>
                                                <div className="flex gap-3 flex-wrap">
                                                    {Object.entries(fareData[fareKey].fare).map(([cls, price]: [string, any]) => (
                                                        <div key={cls} className="bg-white dark:bg-slate-700 rounded-lg px-3 py-2 text-center border border-gray-100 dark:border-slate-600">
                                                            <div className="text-[10px] text-gray-400 font-medium">{cls}</div>
                                                            <div className="text-sm font-bold text-slate-800 dark:text-white">₹{typeof price === 'number' ? price.toLocaleString('en-IN') : price}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ====== PNR Status Tab ======
const PNRCheck: FC = () => {
    const [pnr, setPnr] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleCheck = async (e: FormEvent) => {
        e.preventDefault();
        if (!pnr.trim() || pnr.trim().length !== 10) {
            toast.error('PNR number must be 10 digits');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const data = await checkPNRStatus(pnr.trim());
            setResult(data);
        } catch {
            toast.error('Failed to check PNR status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleCheck} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">PNR Number</label>
                <div className="flex gap-3">
                    <input
                        value={pnr} onChange={e => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit PNR"
                        className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-wider"
                        maxLength={10}
                        required
                    />
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
                    </button>
                </div>
            </form>

            {result && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-3">PNR: {result.pnrNumber}</h3>
                    {result.status ? (
                        <div className="space-y-2 text-sm">
                            {result.status.trainNumber && <div className="flex justify-between"><span className="text-gray-500">Train</span><span className="text-slate-700 dark:text-gray-300">{result.status.trainNumber} — {result.status.trainName}</span></div>}
                            {result.status.boardingPoint && <div className="flex justify-between"><span className="text-gray-500">From</span><span className="text-slate-700 dark:text-gray-300">{result.status.boardingPoint}</span></div>}
                            {result.status.destinationStation && <div className="flex justify-between"><span className="text-gray-500">To</span><span className="text-slate-700 dark:text-gray-300">{result.status.destinationStation}</span></div>}
                            {result.status.journeyClass && <div className="flex justify-between"><span className="text-gray-500">Class</span><span className="text-slate-700 dark:text-gray-300">{result.status.journeyClass}</span></div>}
                            {result.status.chartStatus && <div className="flex justify-between"><span className="text-gray-500">Chart</span><span className="text-slate-700 dark:text-gray-300">{result.status.chartStatus}</span></div>}
                            {result.status.passengers && (
                                <div className="mt-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Passengers</h4>
                                    {result.status.passengers.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between py-1 border-t border-gray-100 dark:border-slate-700">
                                            <span className="text-gray-500">Passenger {i + 1}</span>
                                            <span className={clsx('font-medium', p.currentStatus?.includes('CNF') ? 'text-green-600' : p.currentStatus?.includes('RAC') ? 'text-amber-600' : 'text-red-500')}>
                                                {p.bookingStatus} → {p.currentStatus}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No data available for this PNR.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ====== Train Status Tab ======
const TrainStatusCheck: FC = () => {
    const [trainNumber, setTrainNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<any>(null);

    const handleCheck = async (e: FormEvent) => {
        e.preventDefault();
        if (!trainNumber.trim()) return;
        setLoading(true);
        setStatus(null);
        try {
            const data = await getTrainLiveStatus(trainNumber.trim());
            setStatus(data);
        } catch {
            toast.error('Failed to get train status');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'on-time': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'delayed': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleCheck} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Train Number</label>
                <div className="flex gap-3">
                    <input
                        value={trainNumber} onChange={e => setTrainNumber(e.target.value)}
                        placeholder="e.g. 12951"
                        className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        required
                    />
                    <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Track'}
                    </button>
                </div>
            </form>

            {status && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{status.trainNumber}</span>
                                <h3 className="font-semibold text-slate-800 dark:text-white">{status.trainName}</h3>
                            </div>
                            {status.currentStation && <p className="text-sm text-gray-500 mt-1">Currently at: {status.currentStation}</p>}
                        </div>
                        <span className={clsx('px-3 py-1 rounded-full text-xs font-semibold', statusColor(status.status))}>
                            {status.status === 'on-time' ? 'On Time' : status.status === 'delayed' ? `Delayed ${status.delay}m` : status.status}
                        </span>
                    </div>

                    {status.upcomingStops?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Upcoming Stops</h4>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {status.upcomingStops.map((stop: any, i: number) => (
                                    <div key={i} className={clsx('flex items-center gap-3 text-xs py-1.5 px-2 rounded', stop.arrived ? 'bg-green-50 dark:bg-green-900/10' : '')}>
                                        <div className={clsx('w-2 h-2 rounded-full', stop.arrived ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600')} />
                                        <span className="w-12 text-gray-400 font-mono">{stop.stationCode}</span>
                                        <span className="flex-1 text-slate-700 dark:text-gray-300">{stop.station}</span>
                                        <span className="text-gray-500">{stop.scheduledArrival}</span>
                                        {stop.expectedArrival !== stop.scheduledArrival && (
                                            <span className="text-amber-500 font-medium">{stop.expectedArrival}</span>
                                        )}
                                        {stop.platform && <span className="text-blue-500">P{stop.platform}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ====== Live Station Board Tab ======
const LiveStationBoard: FC = () => {
    const [stationQuery, setStationQuery] = useState('');
    const [stationCode, setStationCode] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [board, setBoard] = useState<any>(null);

    const handleStationSearch = async (query: string) => {
        setStationQuery(query);
        if (query.length < 2) { setSuggestions([]); return; }
        try {
            const data = await searchStation(query);
            setSuggestions(data.stations?.slice(0, 8) || []);
        } catch { /* ignore */ }
    };

    const selectStation = (code: string, name: string) => {
        setStationCode(code);
        setStationQuery(`${name} (${code})`);
        setSuggestions([]);
    };

    const handleLoad = async (e: FormEvent) => {
        e.preventDefault();
        if (!stationCode) {
            toast.error('Select a station from suggestions');
            return;
        }
        setLoading(true);
        setBoard(null);
        try {
            const data = await getLiveStationBoard(stationCode);
            setBoard(data);
        } catch {
            toast.error('Failed to load station board');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleLoad} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200/50 dark:border-slate-700/50">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Station</label>
                <div className="relative">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                value={stationQuery} onChange={e => handleStationSearch(e.target.value)}
                                placeholder="Type station name..."
                                className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-20 max-h-48 overflow-y-auto">
                                    {suggestions.map((s: any) => (
                                        <button key={s.code || s.stationCode} type="button" onClick={() => selectStation(s.code || s.stationCode, s.name || s.stationName)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300 transition-colors">
                                            <span className="font-mono text-xs text-blue-500 mr-2">{s.code || s.stationCode}</span>
                                            {s.name || s.stationName}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={loading || !stationCode} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Load Board'}
                        </button>
                    </div>
                </div>
            </form>

            {board && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
                    <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
                        <h3 className="font-semibold">{board.stationCode} — Live Board</h3>
                        <span className="text-xs text-gray-400">{board.totalTrains} trains</span>
                    </div>
                    {board.trains?.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
                            {board.trains.map((t: any, i: number) => (
                                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-750 text-sm">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{t.trainNumber}</span>
                                            <span className="font-medium text-slate-800 dark:text-white">{t.trainName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                            <span>Arr: {t.arrivalTime}</span>
                                            <span>Dep: {t.departureTime}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {t.platform && <div className="text-xs text-blue-500 font-medium">Platform {t.platform}</div>}
                                        <div className={clsx('text-xs font-medium', t.delayMinutes > 0 ? 'text-amber-500' : 'text-green-500')}>
                                            {t.delayMinutes > 0 ? `+${t.delayMinutes}min` : t.status || 'On Time'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">No trains found at this station.</div>
                    )}
                </div>
            )}
        </div>
    );
};
