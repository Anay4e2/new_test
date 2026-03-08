import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSeasonalWeather, getCities } from '@/services/api';
import type { City } from '@/types';
import { ArrowLeft, Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, Loader2, Thermometer, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface SeasonalData {
    temp: number;
    humidity: number;
    condition: string;
    icon: string;
    advisory?: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('monsoon')) return <CloudRain size={20} />;
    if (c.includes('snow') || c.includes('cold')) return <Snowflake size={20} />;
    if (c.includes('cloud') || c.includes('overcast')) return <Cloud size={20} />;
    if (c.includes('wind') || c.includes('storm')) return <Wind size={20} />;
    return <Sun size={20} />;
};

const getTempColor = (temp: number) => {
    if (temp >= 40) return 'text-red-600 dark:text-red-400';
    if (temp >= 30) return 'text-orange-500 dark:text-orange-400';
    if (temp >= 20) return 'text-amber-500 dark:text-amber-400';
    if (temp >= 10) return 'text-blue-500 dark:text-blue-400';
    return 'text-cyan-500 dark:text-cyan-400';
};

const getBestMonths = (data: Record<number, SeasonalData>): number[] => {
    return Object.entries(data)
        .filter(([, d]) => d.temp >= 15 && d.temp <= 32 && d.humidity < 75)
        .map(([m]) => Number(m))
        .slice(0, 4);
};

export const Weather: FC = () => {
    const navigate = useNavigate();
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [monthlyData, setMonthlyData] = useState<Record<number, SeasonalData>>({});
    const [loading, setLoading] = useState(false);
    const [citiesLoading, setCitiesLoading] = useState(true);

    useEffect(() => {
        getCities().then(c => {
            setCities(c);
            setCitiesLoading(false);
            if (c.length > 0) setSelectedCity(c[0].name);
        }).catch(() => { setCitiesLoading(false); toast.error('Failed to load cities'); });
    }, []);

    useEffect(() => {
        if (!selectedCity) return;
        setLoading(true);
        const fetchAll = async () => {
            const results: Record<number, SeasonalData> = {};
            await Promise.all(
                Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
                    try {
                        const res = await getSeasonalWeather(selectedCity, month);
                        if (res.success) results[month] = res.data;
                    } catch { /* skip */ }
                })
            );
            setMonthlyData(results);
            setLoading(false);
        };
        fetchAll();
    }, [selectedCity]);

    const bestMonths = getBestMonths(monthlyData);
    const currentMonth = new Date().getMonth() + 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Hero */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
                        <Cloud size={16} /> Weather Guide
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-2">Seasonal Weather Planner</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        Check monthly weather patterns to pick the perfect time for your trip
                    </p>
                </div>

                {/* City Selector */}
                <div className="flex justify-center mb-8">
                    {citiesLoading ? (
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                    ) : (
                        <select
                            value={selectedCity}
                            onChange={e => setSelectedCity(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[200px]"
                            aria-label="Select city"
                        >
                            {cities.map(c => (
                                <option key={c._id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Best Time Badge */}
                {!loading && bestMonths.length > 0 && (
                    <div className="text-center mb-6">
                        <span className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium border border-green-200 dark:border-green-800/40">
                            <Sun size={16} /> Best time to visit: {bestMonths.map(m => MONTH_NAMES[m - 1]).join(', ')}
                        </span>
                    </div>
                )}

                {/* Monthly Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : Object.keys(monthlyData).length === 0 ? (
                    <p className="text-center text-gray-400 py-12">No weather data available for {selectedCity}</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                            const data = monthlyData[month];
                            if (!data) return (
                                <div key={month} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 text-center opacity-50">
                                    <p className="text-xs font-medium text-gray-400">{MONTH_NAMES[month - 1]}</p>
                                    <p className="text-xs text-gray-300 mt-2">N/A</p>
                                </div>
                            );
                            const isBest = bestMonths.includes(month);
                            const isCurrent = month === currentMonth;
                            return (
                                <div
                                    key={month}
                                    className={clsx(
                                        'rounded-xl p-4 text-center transition-all hover:shadow-md relative',
                                        isCurrent && 'ring-2 ring-blue-500',
                                        isBest
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40'
                                            : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700'
                                    )}
                                >
                                    {isCurrent && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Now</span>
                                    )}
                                    {isBest && (
                                        <span className="absolute -top-2 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">★</span>
                                    )}
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{MONTH_NAMES[month - 1]}</p>
                                    <div className={clsx('flex items-center justify-center mb-1', getTempColor(data.temp))}>
                                        {getWeatherIcon(data.condition)}
                                    </div>
                                    <p className={clsx('text-lg font-bold', getTempColor(data.temp))}>{data.temp}°C</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-1">{data.condition}</p>
                                    <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-400">
                                        <Droplets size={10} /> {data.humidity}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Advisory Section */}
                {!loading && Object.values(monthlyData).some(d => d.advisory) && (
                    <div className="mt-8 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-500" /> Travel Advisories
                        </h3>
                        {Object.entries(monthlyData)
                            .filter(([, d]) => d.advisory)
                            .map(([month, d]) => (
                                <div key={month} className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                                    <Thermometer size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{MONTH_NAMES[Number(month) - 1]}:</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-300 ml-1">{d.advisory}</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};
