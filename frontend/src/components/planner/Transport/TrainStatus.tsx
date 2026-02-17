import { FC, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, RefreshCw, X, Wifi, WifiOff, Timer } from 'lucide-react';
import { getTrainLiveStatus, getTrainsBetweenCities } from '../../../services/api';
import type { TrainLiveStatus, UpcomingStop } from '../../../types';

interface TrainStatusProps {
    fromCity: string;
    toCity: string;
    date?: string;
    onClose: () => void;
}

interface TrainOption {
    trainNumber: string;
    trainName: string;
    departureTime: string;
    arrivalTime: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    'on-time': { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'On Time' },
    'delayed': { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', label: 'Delayed' },
    'cancelled': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', label: 'Cancelled' },
    'not-started': { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', label: 'Not Started' },
    'unavailable': { bg: 'bg-gray-50 dark:bg-gray-800/50', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400', label: 'Unavailable' },
};

const TrainStatusComponent: FC<TrainStatusProps> = ({ fromCity, toCity, date, onClose }) => {
    const [step, setStep] = useState<'select' | 'status'>('select');
    const [trainOptions, setTrainOptions] = useState<TrainOption[]>([]);
    const [selectedTrain, setSelectedTrain] = useState<TrainOption | null>(null);
    const [status, setStatus] = useState<TrainLiveStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    // Load train options between cities
    useEffect(() => {
        const fetchTrains = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getTrainsBetweenCities(fromCity, toCity, date);
                const trains: TrainOption[] = (result.trains || []).map((t: any) => ({
                    trainNumber: t.trainNumber,
                    trainName: t.trainName,
                    departureTime: t.departureTime,
                    arrivalTime: t.arrivalTime,
                }));
                setTrainOptions(trains);
                if (trains.length === 0) {
                    setError('No trains found for this route');
                }
            } catch {
                setError('Failed to load trains for this route');
            } finally {
                setLoading(false);
            }
        };
        fetchTrains();
    }, [fromCity, toCity, date]);

    // Fetch live status
    const fetchStatus = useCallback(async (trainNum: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTrainLiveStatus(trainNum, date);
            setStatus(result);
            setLastRefresh(new Date());
        } catch {
            setError('Failed to fetch train status');
        } finally {
            setLoading(false);
        }
    }, [date]);

    // Select a train and fetch status
    const handleSelectTrain = (train: TrainOption) => {
        setSelectedTrain(train);
        setStep('status');
        fetchStatus(train.trainNumber);
    };

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (step !== 'status' || !selectedTrain) return;
        const interval = setInterval(() => {
            fetchStatus(selectedTrain.trainNumber);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [step, selectedTrain, fetchStatus]);

    // Countdown for not-started trains
    const getTimeUntilDeparture = (): string | null => {
        if (!selectedTrain?.departureTime) return null;
        try {
            const [h, m] = selectedTrain.departureTime.split(':').map(Number);
            const now = new Date();
            const dep = new Date();
            dep.setHours(h, m, 0, 0);
            if (dep <= now) return null;
            const diff = dep.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${mins}m`;
        } catch {
            return null;
        }
    };

    const statusColor = status ? STATUS_COLORS[status.status] || STATUS_COLORS['unavailable'] : STATUS_COLORS['unavailable'];

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 rounded-xl border border-indigo-200 dark:border-slate-600 bg-white dark:bg-slate-800 overflow-hidden shadow-lg"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚂</span>
                    <span className="font-bold text-sm">
                        {step === 'select' ? 'Select Your Train' : `${selectedTrain?.trainName}`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {step === 'status' && (
                        <button
                            onClick={() => { setStep('select'); setStatus(null); setSelectedTrain(null); }}
                            className="text-white/80 hover:text-white text-xs underline"
                        >
                            Change Train
                        </button>
                    )}
                    {step === 'status' && selectedTrain && (
                        <button
                            onClick={() => fetchStatus(selectedTrain.trainNumber)}
                            className="p-1 rounded hover:bg-white/20 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 rounded hover:bg-white/20 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="p-4">
                <AnimatePresence mode="wait">
                    {/* Step 1: Train Selection */}
                    {step === 'select' && (
                        <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {loading && (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading trains...</span>
                                </div>
                            )}

                            {error && !loading && (
                                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                    <WifiOff size={20} className="mx-auto mb-2 opacity-50" />
                                    {error}
                                </div>
                            )}

                            {!loading && trainOptions.length > 0 && (
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                        {fromCity} → {toCity} • {trainOptions.length} train{trainOptions.length > 1 ? 's' : ''} found
                                    </p>
                                    {trainOptions.map((train) => (
                                        <button
                                            key={train.trainNumber}
                                            onClick={() => handleSelectTrain(train)}
                                            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                                        {train.trainName}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-400">#{train.trainNumber}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {train.departureTime} → {train.arrivalTime}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Live Status */}
                    {step === 'status' && (
                        <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {loading && !status && (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Fetching live status...</span>
                                </div>
                            )}

                            {error && !status && (
                                <div className="text-center py-4">
                                    <WifiOff size={24} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-500">{error}</p>
                                    <button
                                        onClick={() => selectedTrain && fetchStatus(selectedTrain.trainNumber)}
                                        className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 underline"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {status && (
                                <div className="space-y-4">
                                    {/* Status Badge */}
                                    <div className={`flex items-center justify-between p-3 rounded-lg ${statusColor.bg}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${statusColor.dot} ${status.status === 'on-time' || status.status === 'not-started' ? '' : 'animate-pulse'}`} />
                                            <span className={`font-bold text-sm ${statusColor.text}`}>{statusColor.label}</span>
                                            {status.status === 'delayed' && (
                                                <span className={`text-xs ${statusColor.text}`}>({status.delay} min late)</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                            {status.source === 'api' ? <Wifi size={12} /> : <WifiOff size={12} />}
                                            <span>#{status.trainNumber}</span>
                                        </div>
                                    </div>

                                    {/* Delay Warning */}
                                    {status.delay > 30 && (
                                        <motion.div
                                            initial={{ scale: 0.95 }}
                                            animate={{ scale: 1 }}
                                            className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg"
                                        >
                                            <AlertTriangle size={18} className="text-red-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                                                    Significant Delay — {Math.floor(status.delay / 60)}h {status.delay % 60}m
                                                </p>
                                                <p className="text-xs text-red-600 dark:text-red-400">
                                                    Consider checking for alternative travel options
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Not-started countdown */}
                                    {status.status === 'not-started' && getTimeUntilDeparture() && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <Timer size={18} className="text-blue-500" />
                                            <div>
                                                <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                                    Departing in {getTimeUntilDeparture()}
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    Scheduled: {selectedTrain?.departureTime}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Current Station */}
                                    {status.currentStation !== 'Unknown' && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin size={16} className="text-indigo-500" />
                                            <span className="text-gray-600 dark:text-gray-300">Currently at:</span>
                                            <span className="font-bold text-gray-800 dark:text-white">{status.currentStation}</span>
                                        </div>
                                    )}

                                    {/* Station Timeline */}
                                    {status.upcomingStops.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                Route Timeline
                                            </p>
                                            <div className="space-y-0 ml-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                {status.upcomingStops.map((stop: UpcomingStop, i: number) => {
                                                    const isCurrentStop = stop.station === status.currentStation;
                                                    const isDelayed = stop.scheduledArrival !== stop.expectedArrival && !stop.arrived;
                                                    return (
                                                        <div key={`${stop.stationCode}-${i}`} className="flex items-start gap-3 relative">
                                                            {/* Timeline line */}
                                                            {i < status.upcomingStops.length - 1 && (
                                                                <div className={`absolute left-[7px] top-5 w-0.5 h-full ${stop.arrived ? 'bg-emerald-300 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-gray-600'}`} />
                                                            )}
                                                            {/* Dot */}
                                                            <div className={`relative z-10 mt-1.5 shrink-0 w-4 h-4 rounded-full border-2 ${isCurrentStop
                                                                    ? 'bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-300'
                                                                    : stop.arrived
                                                                        ? 'bg-emerald-500 border-emerald-500'
                                                                        : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-500'
                                                                }`}>
                                                                {isCurrentStop && (
                                                                    <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75" />
                                                                )}
                                                            </div>
                                                            {/* Info */}
                                                            <div className={`pb-4 flex-1 ${stop.arrived ? 'opacity-60' : ''}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-xs font-semibold ${isCurrentStop ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                        {stop.station}
                                                                        <span className="ml-1 text-[10px] text-gray-400">({stop.stationCode})</span>
                                                                    </span>
                                                                    {stop.platform && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 font-mono">
                                                                            PF {stop.platform}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                                    <span>Arr: {stop.scheduledArrival || '—'}</span>
                                                                    {isDelayed && (
                                                                        <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                                                                            ETA: {stop.expectedArrival}
                                                                        </span>
                                                                    )}
                                                                    {stop.haltTime && <span className="ml-2">• Halt: {stop.haltTime}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Unavailable message */}
                                    {status.status === 'unavailable' && (
                                        <div className="text-center py-3">
                                            <WifiOff size={20} className="mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Live status is currently unavailable for this train
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Try again later or check closer to the departure time
                                            </p>
                                        </div>
                                    )}

                                    {/* Last refresh */}
                                    {lastRefresh && (
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700">
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                Updated {lastRefresh.toLocaleTimeString()}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                Auto-refresh in 5 min
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default TrainStatusComponent;
