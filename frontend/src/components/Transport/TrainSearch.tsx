import { FC, useState, useEffect } from 'react';
import axios from 'axios';

interface TrainInfo {
    trainNumber: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    daysOfOperation: string[];
    classes: string[];
    fromStation: string;
    toStation: string;
    source: 'api' | 'cached';
}

interface TrainSearchResult {
    fromStation: string;
    toStation: string;
    trains: TrainInfo[];
    totalTrains: number;
    lastUpdated: string;
    source: 'rapidapi' | 'cached';
}

interface TrainSearchProps {
    fromCity?: string;
    toCity?: string;
    autoSearch?: boolean;
}

export const TrainSearch: FC<TrainSearchProps> = ({ fromCity, toCity, autoSearch = false }) => {
    const [from, setFrom] = useState(fromCity || '');
    const [to, setTo] = useState(toCity || '');
    const [result, setResult] = useState<TrainSearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    // Popular cities for quick selection
    const popularCities = [
        'Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore',
        'Hyderabad', 'Jaipur', 'Ahmedabad', 'Pune', 'Varanasi'
    ];

    useEffect(() => {
        if (fromCity) setFrom(fromCity);
        if (toCity) setTo(toCity);
    }, [fromCity, toCity]);

    useEffect(() => {
        if (autoSearch && from && to) {
            searchTrains();
        }
    }, [autoSearch, from, to]);

    const searchTrains = async () => {
        if (!from || !to) {
            setError('Please select both cities');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await axios.get(`/api/trains/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);
            setResult(res.data);

            if (res.data.trains.length === 0) {
                setError('No trains found for this route. Try a different date or route.');
            }
        } catch (e: any) {
            console.error('Train search error:', e);
            setError(e.response?.data?.error || 'Failed to fetch train information');
        } finally {
            setLoading(false);
        }
    };

    const swapCities = () => {
        setFrom(to);
        setTo(from);
        setResult(null);
    };

    return (
        <div className="bg-neutral-800/50 rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🚂</span>
                    Train Search
                </h3>
                <p className="text-xs text-gray-400 mt-1">Find trains between cities</p>
            </div>

            {/* Search Form */}
            <div className="p-4 space-y-3">
                {/* From City */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1">From</label>
                    <select
                        value={from}
                        onChange={(e) => { setFrom(e.target.value); setResult(null); }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Select city</option>
                        {popularCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>

                {/* Swap button */}
                <div className="flex justify-center">
                    <button
                        onClick={swapCities}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Swap cities"
                    >
                        <span className="text-xl">⇅</span>
                    </button>
                </div>

                {/* To City */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1">To</label>
                    <select
                        value={to}
                        onChange={(e) => { setTo(e.target.value); setResult(null); }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                        <option value="">Select city</option>
                        {popularCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>

                {/* Search Button */}
                <button
                    onClick={searchTrains}
                    disabled={loading || !from || !to}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading || !from || !to
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Searching...
                        </span>
                    ) : (
                        'Search Trains'
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 pb-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                        {error}
                    </div>
                </div>
            )}

            {/* Results */}
            {result && result.trains.length > 0 && (
                <div className="border-t border-white/10">
                    <div className="p-3 bg-white/5 flex items-center justify-between">
                        <span className="text-sm text-white font-medium">
                            {result.totalTrains} trains found
                        </span>
                        <span className="text-xs text-gray-400">
                            {result.source === 'rapidapi' ? '🟢 Live data' : '📦 Cached'}
                        </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {result.trains.map((train, i) => (
                            <div
                                key={`${train.trainNumber}-${i}`}
                                className="border-b border-white/5 last:border-b-0"
                            >
                                {/* Train Header */}
                                <div
                                    className="p-3 hover:bg-white/5 cursor-pointer transition-colors"
                                    onClick={() => setExpanded(expanded === train.trainNumber ? null : train.trainNumber)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">
                                                {train.trainNumber} - {train.trainName}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {train.fromStation} → {train.toStation}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-emerald-400">
                                                {train.departureTime}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {train.duration}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick info */}
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        {train.classes?.slice(0, 4).map((cls, j) => (
                                            <span
                                                key={j}
                                                className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded"
                                            >
                                                {cls}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expanded === train.trainNumber && (
                                    <div className="px-3 pb-3 bg-white/5">
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-gray-400">Departure:</span>
                                                <span className="text-white ml-2">{train.departureTime}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Arrival:</span>
                                                <span className="text-white ml-2">{train.arrivalTime}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-400">Runs on:</span>
                                                <span className="text-white ml-2">
                                                    {train.daysOfOperation?.join(', ') || 'Daily'}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-400">Classes:</span>
                                                <span className="text-white ml-2">
                                                    {train.classes?.join(', ') || 'All'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainSearch;
