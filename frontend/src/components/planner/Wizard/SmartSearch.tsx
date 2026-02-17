import { FC, useState, useRef, useEffect } from 'react';
import { TripRequest, ParsedTripQuery, TripSuggestion } from '@/types';
import { parseTripQuery, getTripIdeas } from '@/services/api';
import { Search, Sparkles, X, Check, Loader2, ArrowRight, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface SmartSearchProps {
    onGenerate: (data: TripRequest) => void;
    cities: any[];
    isLoading: boolean;
}

const QUICK_CHIPS = [
    { label: '🏰 Heritage', interest: 'heritage' },
    { label: '🍜 Food Tour', interest: 'food' },
    { label: '🐪 Desert', interest: 'desert' },
    { label: '🙏 Spiritual', interest: 'spiritual' },
    { label: '💑 Honeymoon', interest: 'honeymoon' },
    { label: '🏖️ Beach', interest: 'beach' },
    { label: '🌿 Nature', interest: 'nature' },
    { label: '⚡ Adventure', interest: 'adventure' },
];

const CONFIDENCE_COLORS: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
    medium: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
    low: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
}

const BUDGET_LABELS: Record<string, string> = {
    budget: '💰 Budget',
    standard: '💎 Standard',
    premium: '👑 Premium',
};

const STYLE_LABELS: Record<string, string> = {
    relaxed: '🧘 Relaxed',
    fast: '⚡ Fast-paced',
};

export const SmartSearch: FC<SmartSearchProps> = ({ onGenerate, cities, isLoading }) => {
    const [query, setQuery] = useState('');
    const [parsedResult, setParsedResult] = useState<ParsedTripQuery | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [tripIdeas, setTripIdeas] = useState<TripSuggestion[]>([]);
    const [loadingIdeas, setLoadingIdeas] = useState(false);
    const [activeInterests, setActiveInterests] = useState<string[]>([]);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Load trip ideas on mount
    useEffect(() => {
        fetchTripIdeas([]);
    }, []);

    const fetchTripIdeas = async (interests: string[]) => {
        setLoadingIdeas(true);
        try {
            const ideas = await getTripIdeas(interests);
            setTripIdeas(ideas);
        } catch (e) {
            console.error('Failed to fetch trip ideas:', e);
        } finally {
            setLoadingIdeas(false);
        }
    };

    const handleInterestToggle = (interest: string) => {
        const next = activeInterests.includes(interest)
            ? activeInterests.filter(i => i !== interest)
            : [...activeInterests, interest];
        setActiveInterests(next);
        fetchTripIdeas(next);
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setParsedResult(null);

        // Debounced auto-suggest
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length > 10) {
            debounceRef.current = setTimeout(() => {
                handleParse(value);
            }, 600);
        }
    };

    const handleParse = async (text?: string) => {
        const q = text || query;
        if (!q.trim()) return;

        setIsParsing(true);
        try {
            const result = await parseTripQuery(q);
            setParsedResult(result);
        } catch (e) {
            console.error('Failed to parse trip query:', e);
        } finally {
            setIsParsing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleParse();
    };

    const handleRemoveChip = (field: string) => {
        if (!parsedResult) return;
        const updated = { ...parsedResult };
        const req = { ...updated.tripRequest };

        switch (field) {
            case 'duration': delete req.duration; break;
            case 'budget': delete req.budget; break;
            case 'style': delete req.travelStyle; break;
            case 'location': delete req.stateCode; delete req.selectedCityIds; break;
            case 'seniorFriendly':
                if (req.constraints) req.constraints = { ...req.constraints, seniorFriendly: false };
                break;
            case 'morningReligious':
                if (req.constraints) req.constraints = { ...req.constraints, morningReligious: false };
                break;
        }

        updated.tripRequest = req;
        setParsedResult(updated);
    };

    const handleGenerateTrip = () => {
        if (!parsedResult?.tripRequest) return;

        const req: TripRequest = {
            stateCode: parsedResult.tripRequest.stateCode || 'RJ',
            selectedCityIds: parsedResult.tripRequest.selectedCityIds || [],
            duration: parsedResult.tripRequest.duration || 5,
            budget: parsedResult.tripRequest.budget || 'standard',
            travelStyle: parsedResult.tripRequest.travelStyle || 'relaxed',
            constraints: parsedResult.tripRequest.constraints || {
                maxTravelHoursPerDay: 6,
                seniorFriendly: false,
                morningReligious: false,
                noNightTravel: true,
            },
        };

        // If no cities selected, pick cities from the state
        if (req.selectedCityIds.length === 0) {
            const stateCities = cities.filter((c: any) => {
                const stateCodeMap: Record<string, string> = {
                    RJ: 'RAJASTHAN', KL: 'KERALA', GA: 'GOA', HP: 'HIMACHAL_PRADESH',
                    UP: 'UTTAR_PRADESH', MP: 'MADHYA_PRADESH', GJ: 'GUJARAT',
                    MH: 'MAHARASHTR', TN: 'TAMIL_NADU', WB: 'WEST_BENGA', KA: 'KARNATAKA',
                };
                return c.stateCode === (stateCodeMap[req.stateCode] || req.stateCode);
            });
            req.selectedCityIds = stateCities.slice(0, 3).map((c: any) => c._id);
        }

        onGenerate(req);
    };

    const handleIdeaClick = (idea: TripSuggestion) => {
        const req: TripRequest = {
            stateCode: idea.stateCode,
            selectedCityIds: idea.cityIds,
            duration: idea.duration,
            budget: idea.budget,
            travelStyle: 'relaxed',
            constraints: {
                maxTravelHoursPerDay: 6,
                seniorFriendly: false,
                morningReligious: false,
                noNightTravel: true,
            },
        };
        onGenerate(req);
    };

    const chips = parsedResult ? buildChips(parsedResult) : [];

    return (
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl">
                        <Wand2 size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Smart Trip Planner</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Describe your dream trip in natural language and we'll plan it for you.
                </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={e => handleQueryChange(e.target.value)}
                        placeholder="Describe your dream trip... e.g., '5 day budget Rajasthan with family' or 'luxury honeymoon in Udaipur for a week'"
                        className="w-full p-4 pr-12 border-2 border-gray-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-violet-400 outline-none transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                        rows={3}
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isParsing}
                        className="absolute bottom-3 right-3 p-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-xl hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                        {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                </div>
            </form>

            {/* Quick Interest Chips */}
            <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quick filters</p>
                <div className="flex flex-wrap gap-2">
                    {QUICK_CHIPS.map(chip => (
                        <button
                            key={chip.interest}
                            onClick={() => handleInterestToggle(chip.interest)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                                activeInterests.includes(chip.interest)
                                    ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300 shadow-sm'
                                    : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                            )}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Parsed Results */}
            <AnimatePresence mode="wait">
                {isParsing && (
                    <motion.div
                        key="parsing"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 mb-6"
                    >
                        <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin text-violet-500" size={20} />
                            <span className="text-violet-700 dark:text-violet-300 font-medium">Analyzing your trip description...</span>
                        </div>
                    </motion.div>
                )}

                {parsedResult && !isParsing && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        {/* Interpreted Chips */}
                        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles size={16} className="text-violet-500" />
                                <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">We understood your trip as:</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {chips.map((chip, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                                            CONFIDENCE_COLORS[getConfidenceLevel(chip.confidence)]
                                        )}
                                    >
                                        <span>{chip.icon}</span>
                                        <span>{chip.label}</span>
                                        <button
                                            onClick={() => handleRemoveChip(chip.field)}
                                            className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Low confidence warning */}
                            {Object.values(parsedResult.confidence).some(v => v > 0 && v < 0.7) && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                                    ⚠️ Some fields have low confidence. You can remove or adjust the chips above.
                                </p>
                            )}
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerateTrip}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
                                    Looks good? Generate Itinerary
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trip Ideas Section */}
            {!parsedResult && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-amber-500" />
                        <h3 className="font-bold text-gray-700 dark:text-gray-300">Need Inspiration?</h3>
                    </div>

                    {loadingIdeas ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-violet-500" size={24} />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tripIdeas.slice(0, 5).map((idea, i) => (
                                <motion.div
                                    key={idea.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleIdeaClick(idea)}
                                    className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer hover:shadow-lg transition-all hover:border-violet-300 dark:hover:border-violet-600"
                                >
                                    <div className="flex gap-3 p-3">
                                        {/* Image */}
                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                            <img
                                                src={idea.imageUrl}
                                                alt={idea.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                                                {idea.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                {idea.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full font-medium">
                                                    📅 {idea.duration} days
                                                </span>
                                                <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium capitalize">
                                                    {BUDGET_LABELS[idea.budget] || idea.budget}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight size={16} className="text-violet-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Helper: Build chips from parsed result ──────────────────────
function buildChips(result: ParsedTripQuery): Array<{ label: string; icon: string; field: string; confidence: number }> {
    const chips: Array<{ label: string; icon: string; field: string; confidence: number }> = [];
    const { tripRequest, confidence } = result;

    if (tripRequest.duration) {
        chips.push({ label: `${tripRequest.duration} days`, icon: '📅', field: 'duration', confidence: confidence.duration || 0 });
    }

    if (tripRequest.budget) {
        chips.push({ label: BUDGET_LABELS[tripRequest.budget] || tripRequest.budget, icon: '', field: 'budget', confidence: confidence.budget || 0 });
    }

    if (tripRequest.travelStyle) {
        chips.push({ label: STYLE_LABELS[tripRequest.travelStyle] || tripRequest.travelStyle, icon: '', field: 'style', confidence: confidence.style || 0 });
    }

    if (tripRequest.stateCode) {
        const label = tripRequest.stateCode;
        chips.push({ label, icon: '📍', field: 'location', confidence: confidence.location || 0 });
    }

    if (tripRequest.constraints?.seniorFriendly) {
        chips.push({ label: 'Senior-friendly', icon: '👴', field: 'seniorFriendly', confidence: confidence.constraints || 0 });
    }

    if (tripRequest.constraints?.morningReligious) {
        chips.push({ label: 'Morning religious', icon: '🙏', field: 'morningReligious', confidence: confidence.constraints || 0 });
    }

    return chips;
}
