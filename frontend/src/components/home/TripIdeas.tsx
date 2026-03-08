import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTripIdeas } from '@/services/api';
import { TripSuggestion } from '@/types';
import { Sparkles, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const INTEREST_TABS = [
    { label: 'All', value: '' },
    { label: '🏰 Heritage', value: 'heritage' },
    { label: '🙏 Spiritual', value: 'spiritual' },
    { label: '💑 Honeymoon', value: 'honeymoon' },
    { label: '🏖️ Beach', value: 'beach' },
    { label: '🐪 Desert', value: 'desert' },
    { label: '🍜 Food', value: 'food' },
    { label: '🌿 Nature', value: 'nature' },
];

const BUDGET_LABELS: Record<string, string> = {
    budget: '💰 Budget',
    standard: '💎 Standard',
    premium: '👑 Premium',
};

export const TripIdeas: FC = () => {
    const [ideas, setIdeas] = useState<TripSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchIdeas(activeTab);
    }, [activeTab]);

    const fetchIdeas = async (interest: string) => {
        setLoading(true);
        try {
            const data = await getTripIdeas(interest ? [interest] : []);
            setIdeas(data);
        } catch (e) {
            console.error('Failed to fetch trip ideas:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleIdeaClick = (idea: TripSuggestion) => {
        const params = new URLSearchParams({
            state: idea.stateCode,
            cities: idea.cityIds.join(','),
            duration: idea.duration.toString(),
            budget: idea.budget,
            tab: 'smart',
        });
        navigate(`/plan?${params.toString()}`);
    };

    return (
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-4">
                        <Sparkles size={16} />
                        Need Inspiration?
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        Curated Trip Ideas
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Handpicked itineraries designed by travel experts. Click any to start planning instantly.
                    </p>
                </div>

                {/* Interest Filter Tabs */}
                <div className="flex justify-center gap-2 mb-8 sm:mb-10 flex-wrap">
                    {INTEREST_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={clsx(
                                'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                                activeTab === tab.value
                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-600 hover:border-gray-300'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-violet-500" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <AnimatePresence mode="popLayout">
                            {ideas.slice(0, 6).map((idea, i) => (
                                <motion.div
                                    key={idea.title}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.06 }}
                                    onClick={() => handleIdeaClick(idea)}
                                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
                                >
                                    {/* Image */}
                                    <div className="relative h-44 overflow-hidden">
                                        <img
                                            src={idea.imageUrl}
                                            alt={idea.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                        {/* Badges */}
                                        <div className="absolute bottom-3 left-3 flex gap-2">
                                            <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {idea.duration} days
                                            </span>
                                            <span className="px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800 dark:text-gray-200">
                                                {BUDGET_LABELS[idea.budget] || idea.budget}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                            {idea.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                            {idea.description}
                                        </p>

                                        {/* Highlights */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {idea.highlights.slice(0, 3).map(h => (
                                                <span key={h} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-md">
                                                    {h}
                                                </span>
                                            ))}
                                            {idea.highlights.length > 3 && (
                                                <span className="text-xs px-2 py-0.5 text-gray-400">
                                                    +{idea.highlights.length - 3} more
                                                </span>
                                            )}
                                        </div>

                                        {/* CTA */}
                                        <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-semibold text-sm group-hover:gap-2 transition-all">
                                            Plan this trip
                                            <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </section>
    );
};
