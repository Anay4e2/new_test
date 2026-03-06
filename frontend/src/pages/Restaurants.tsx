import { FC, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getRestaurantsByCity, getRestaurantsByType, getCities } from '@/services/api';
import type { Restaurant, City } from '@/types';
import { ArrowLeft, UtensilsCrossed, Star, MapPin, Clock, Leaf, IndianRupee, Loader2, Search } from 'lucide-react';

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'street-food', label: '🍜 Street Food' },
    { value: 'dhaba', label: '🍛 Dhaba' },
    { value: 'casual', label: '🍽️ Casual' },
    { value: 'fine-dining', label: '✨ Fine Dining' },
    { value: 'cafe', label: '☕ Café' },
];

const PRICE_LABELS: Record<string, string> = {
    budget: '₹',
    moderate: '₹₹',
    expensive: '₹₹₹',
};

export const Restaurants: FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCity = searchParams.get('city') || '';

    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState(initialCity);
    const [typeFilter, setTypeFilter] = useState('');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(false);
    const [citiesLoading, setCitiesLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        getCities().then(c => {
            setCities(c);
            setCitiesLoading(false);
            if (!selectedCity && c.length > 0) setSelectedCity(c[0].name);
        }).catch(() => { setCitiesLoading(false); toast.error('Failed to load cities'); });
    }, []);

    useEffect(() => {
        if (!selectedCity) return;
        setLoading(true);
        const fetch = typeFilter
            ? getRestaurantsByType(selectedCity, typeFilter)
            : getRestaurantsByCity(selectedCity);
        fetch.then(r => setRestaurants(r))
            .catch(() => { setRestaurants([]); toast.error('Failed to load restaurants'); })
            .finally(() => setLoading(false));
    }, [selectedCity, typeFilter]);

    const filtered = search
        ? restaurants.filter(r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.cuisine.some(c => c.toLowerCase().includes(search.toLowerCase())) ||
            r.mustTry.some(m => m.toLowerCase().includes(search.toLowerCase()))
        )
        : restaurants;

    const vegCount = filtered.filter(r => r.vegetarian).length;
    const avgRating = filtered.length > 0
        ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
        : '0';

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
                    <ArrowLeft size={16} /> Back
                </button>

                {/* Hero */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
                        <UtensilsCrossed size={16} /> Restaurant Guide
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Discover Restaurants</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                        Explore local eateries, street food & fine dining across Indian cities
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    {citiesLoading ? (
                        <Loader2 size={20} className="animate-spin text-orange-500" />
                    ) : (
                        <select
                            value={selectedCity}
                            onChange={e => { setSelectedCity(e.target.value); setTypeFilter(''); }}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none min-w-[160px]"
                            aria-label="Select city"
                        >
                            {cities.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                        </select>
                    )}
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        aria-label="Filter by type"
                    >
                        {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, cuisine, must-try..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            aria-label="Search restaurants"
                        />
                    </div>
                </div>

                {/* Stats */}
                {!loading && filtered.length > 0 && (
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{filtered.length} restaurant{filtered.length !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {avgRating} avg</span>
                        <span className="flex items-center gap-1"><Leaf size={12} className="text-green-500" /> {vegCount} veg</span>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-orange-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                        <UtensilsCrossed size={40} className="mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No restaurants found</p>
                        <p className="text-sm mt-1">Try a different city or filter</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(r => (
                            <div key={r._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{r.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <MapPin size={10} /> {r.cityName}
                                                </span>
                                                {r.vegetarian && (
                                                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                                        <Leaf size={8} /> Veg
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">
                                            <Star size={12} className="fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{r.rating}</span>
                                        </div>
                                    </div>

                                    {/* Type & Price */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[11px] bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full capitalize">{r.type.replace('-', ' ')}</span>
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">{PRICE_LABELS[r.priceRange] || r.priceRange}</span>
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                                            <IndianRupee size={10} />{r.averageCost}
                                        </span>
                                    </div>

                                    {/* Cuisine */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {r.cuisine.slice(0, 3).map(c => (
                                            <span key={c} className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{c}</span>
                                        ))}
                                        {r.cuisine.length > 3 && (
                                            <span className="text-[10px] text-gray-400">+{r.cuisine.length - 3}</span>
                                        )}
                                    </div>

                                    {/* Must Try */}
                                    {r.mustTry.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1">Must Try</p>
                                            <div className="flex flex-wrap gap-1">
                                                {r.mustTry.slice(0, 3).map(m => (
                                                    <span key={m} className="text-[11px] bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hours */}
                                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                        <Clock size={10} />
                                        <span>{r.openingTime} – {r.closingTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
