import { FC, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPackages, getPackageById, getConfig } from '@/services/api';
import { useTripStore } from '@/stores/tripStore';
import type { Package, Place } from '@/types';
import ThemeToggle from '@/components/common/ThemeToggle';

// ── Filter constants ──
const DURATION_OPTIONS = [
    { label: '1–3 Nights', min: 1, max: 3 },
    { label: '4–6 Nights', min: 4, max: 6 },
    { label: '7–9 Nights', min: 7, max: 9 },
    { label: '10+ Nights', min: 10, max: Infinity },
];

const BUDGET_OPTIONS = [
    { label: '₹0 – ₹5,000', min: 0, max: 5000 },
    { label: '₹5,000 – ₹15,000', min: 5000, max: 15000 },
    { label: '₹15,000 – ₹30,000', min: 15000, max: 30000 },
    { label: '₹30,000+', min: 30000, max: Infinity },
];

const CATEGORY_TABS = ['All', 'Honeymoon', 'Weekend Getaways', 'Wildlife & Nature', 'Heritage', 'Adventure'];

export const Packages: FC = () => {
    // Data state
    const [packages, setPackages] = useState<Package[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [selectedDurations, setSelectedDurations] = useState<number[]>([]);
    const [selectedBudgets, setSelectedBudgets] = useState<number[]>([]);
    const [selectedState, setSelectedState] = useState<string>('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Adding to trip
    const [addingId, setAddingId] = useState<string | null>(null);
    const { addPlace } = useTripStore();

    // ── Fetch data ──
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [pkgRes, cfgRes] = await Promise.all([getPackages(), getConfig()]);
                if (pkgRes.success) setPackages(pkgRes.data);
                // Derive unique states
                const uniqueStates = Array.from(new Set(pkgRes.data.map((p: Package) => p.state))).sort();
                setStates(uniqueStates);
            } catch {
                setError('Failed to load packages. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ── Filter logic ──
    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            // Duration filter
            if (selectedDurations.length > 0) {
                const matchesDuration = selectedDurations.some(i => {
                    const opt = DURATION_OPTIONS[i];
                    return pkg.days >= opt.min && pkg.days <= opt.max;
                });
                if (!matchesDuration) return false;
            }

            // Budget filter
            if (selectedBudgets.length > 0) {
                const matchesBudget = selectedBudgets.some(i => {
                    const opt = BUDGET_OPTIONS[i];
                    return pkg.price >= opt.min && pkg.price <= opt.max;
                });
                if (!matchesBudget) return false;
            }

            // State filter
            if (selectedState && pkg.state !== selectedState) return false;

            // Category tab filter (matches tags)
            if (activeCategory !== 'All') {
                const catLower = activeCategory.toLowerCase();
                const hasTag = pkg.tags.some(t => t.toLowerCase().includes(catLower));
                if (!hasTag) return false;
            }

            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches = pkg.title.toLowerCase().includes(q) ||
                    pkg.description?.toLowerCase().includes(q) ||
                    pkg.state.toLowerCase().includes(q) ||
                    pkg.cities.some(c => c.toLowerCase().includes(q));
                if (!matches) return false;
            }

            return true;
        });
    }, [packages, selectedDurations, selectedBudgets, selectedState, activeCategory, searchQuery]);

    // ── Handlers ──
    const toggleDuration = (idx: number) => {
        setSelectedDurations(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const toggleBudget = (idx: number) => {
        setSelectedBudgets(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const clearFilters = () => {
        setSelectedDurations([]);
        setSelectedBudgets([]);
        setSelectedState('');
        setActiveCategory('All');
        setSearchQuery('');
    };

    const handleAddToTrip = async (pkg: Package) => {
        setAddingId(pkg._id);
        try {
            const response = await getPackageById(pkg.id);
            if (response.success && response.data.placesDetails) {
                response.data.placesDetails.forEach((place: Place) => {
                    addPlace(place);
                });
            }
        } catch {
            console.error('Error adding package to trip');
        } finally {
            setAddingId(null);
        }
    };

    const activeFilterCount = selectedDurations.length + selectedBudgets.length + (selectedState ? 1 : 0) + (activeCategory !== 'All' ? 1 : 0);

    // ── Filter sidebar JSX (shared between desktop and mobile) ──
    const filterContent = (
        <>
            {/* Duration */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-600 rounded-full" />
                    Duration (Nights)
                </h3>
                <div className="space-y-2">
                    {DURATION_OPTIONS.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedDurations.includes(idx)
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-slate-300 dark:border-slate-500 group-hover:border-blue-400'
                                }`}>
                                {selectedDurations.includes(idx) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Budget */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                    Budget (per person)
                </h3>
                <div className="space-y-2">
                    {BUDGET_OPTIONS.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedBudgets.includes(idx)
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-slate-300 dark:border-slate-500 group-hover:border-emerald-400'
                                }`}>
                                {selectedBudgets.includes(idx) && (
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {opt.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* State */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-orange-500 rounded-full" />
                    State
                </h3>
                <select
                    value={selectedState}
                    onChange={e => setSelectedState(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                    <option value="">All States</option>
                    {states.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
                <button
                    onClick={clearFilters}
                    className="w-full py-2.5 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    ✕ Clear All Filters ({activeFilterCount})
                </button>
            )}
        </>
    );

    // ── Render ──
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Top Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 lg:px-8 py-3">
                    {/* Left */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <span className="font-bold text-lg text-slate-800 dark:text-white hidden sm:block">TripPlanner</span>
                        </Link>
                        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-600" />
                        <nav className="hidden sm:flex items-center gap-1 text-sm">
                            <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
                            <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                            <span className="text-slate-800 dark:text-white font-medium">Packages</span>
                        </nav>
                    </div>

                    {/* Search bar */}
                    <div className="flex-1 max-w-md mx-4">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search packages, cities, states..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            to="/plan"
                            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                        >
                            ✈️ Plan Trip
                        </Link>
                    </div>
                </div>
            </header>

            {/* Category tabs bar */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                        {CATEGORY_TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveCategory(tab)}
                                className={`flex-shrink-0 px-5 py-3 text-sm font-medium rounded-lg transition-all relative ${activeCategory === tab
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {tab}
                                {activeCategory === tab && (
                                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile filter toggle */}
            <div className="lg:hidden px-4 py-3">
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Mobile filter panel */}
            {showMobileFilters && (
                <div className="lg:hidden mx-4 mb-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                    {filterContent}
                </div>
            )}

            {/* Main layout */}
            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
                <div className="flex gap-8">
                    {/* Desktop Filter Sidebar */}
                    <aside className="hidden lg:block w-[280px] flex-shrink-0">
                        <div className="sticky top-[72px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    FILTERS
                                </h2>
                            </div>
                            {filterContent}
                        </div>
                    </aside>

                    {/* Package Cards */}
                    <main className="flex-1 min-w-0">
                        {/* Results header */}
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Showing <span className="font-semibold text-slate-800 dark:text-white">{filteredPackages.length}</span> package{filteredPackages.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse">
                                        <div className="h-52 bg-slate-200 dark:bg-slate-700" />
                                        <div className="p-5 space-y-3">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                                            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                                            <div className="flex gap-2">
                                                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error */}
                        {error && !loading && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && !error && filteredPackages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="text-6xl mb-4">🏖️</div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No packages found</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 max-w-sm">
                                    Try adjusting your filters or search to find the perfect travel package.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        )}

                        {/* Package cards grid */}
                        {!loading && !error && filteredPackages.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredPackages.map(pkg => (
                                    <div
                                        key={pkg._id}
                                        className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 group"
                                    >
                                        {/* Image */}
                                        <div className="relative h-52 overflow-hidden">
                                            <img
                                                src={pkg.image || `https://picsum.photos/seed/${pkg.id}/600/400`}
                                                alt={pkg.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${pkg.title}/600/400`;
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                            {/* State badge */}
                                            <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-lg">
                                                {pkg.state}
                                            </div>

                                            {/* Duration badge */}
                                            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-800 dark:text-white text-xs font-semibold rounded-full shadow-lg">
                                                🌙 {pkg.days} Night{pkg.days !== 1 ? 's' : ''} / {pkg.days + 1} Day{pkg.days !== 0 ? 's' : ''}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                                {pkg.title}
                                            </h3>

                                            {/* Quick info row */}
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {pkg.cities.length} {pkg.cities.length === 1 ? 'City' : 'Cities'}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span className="flex items-center gap-1">
                                                    📅 {pkg.days} Day{pkg.days !== 1 ? 's' : ''}
                                                </span>
                                                {pkg.cities.length > 0 && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                                                            {pkg.cities.slice(0, 3).join(' → ')}{pkg.cities.length > 3 ? ` +${pkg.cities.length - 3}` : ''}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {pkg.description && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{pkg.description}</p>
                                            )}

                                            {/* Tags */}
                                            {pkg.tags && pkg.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-4">
                                                    {pkg.tags.slice(0, 4).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {pkg.tags.length > 4 && (
                                                        <span className="px-2.5 py-1 text-slate-400 dark:text-slate-500 text-xs">
                                                            +{pkg.tags.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Price & CTA */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                                <div>
                                                    <span className="text-xs text-slate-400">Starting from</span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                            ₹{pkg.price.toLocaleString()}
                                                        </span>
                                                        <span className="text-xs text-slate-400">per person</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAddToTrip(pkg)}
                                                        disabled={addingId === pkg._id}
                                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all flex items-center gap-1.5"
                                                    >
                                                        {addingId === pkg._id ? (
                                                            <>
                                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                Adding...
                                                            </>
                                                        ) : (
                                                            <>+ Add to Trip</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
