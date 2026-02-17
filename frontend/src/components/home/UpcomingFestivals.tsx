import { FC, useState, useEffect } from 'react';
import { Festival } from '@/types';
import { getUpcomingFestivals } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, ArrowRight, Sparkles, Users } from 'lucide-react';
import clsx from 'clsx';

const TYPE_ICONS: Record<string, string> = {
    religious: '🟠', cultural: '🔵', fair: '🟢', music: '🟣', food: '🔴', art: '🎨',
};

const CROWD_DOTS: Record<string, number> = { extreme: 4, high: 3, moderate: 2, low: 1 };

export const UpcomingFestivals: FC = () => {
    const [festivals, setFestivals] = useState<Festival[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        getUpcomingFestivals()
            .then(data => setFestivals(data.slice(0, 5)))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading || festivals.length === 0) return null;

    return (
        <section className="py-16 px-4 bg-gradient-to-br from-orange-50/50 via-white to-pink-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={18} className="text-orange-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Don't Miss Out</span>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">Upcoming Festivals</h2>
                        </div>
                        <button
                            onClick={() => navigate('/festivals')}
                            className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors"
                        >
                            View All <ArrowRight size={16} />
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {festivals.map((festival, i) => {
                        const dots = CROWD_DOTS[festival.crowdLevel] || 2;
                        return (
                            <motion.div
                                key={festival._id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer"
                                onClick={() => navigate('/festivals')}
                            >
                                <div className="relative h-28 overflow-hidden">
                                    <img
                                        src={festival.imageUrl || `https://picsum.photos/seed/${festival._id}/400/200`}
                                        alt={festival.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    <div className="absolute bottom-2 left-2">
                                        <span className="text-lg">{TYPE_ICONS[festival.type] || '🎪'}</span>
                                    </div>
                                    {festival.impact === 'must-see' && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/90 text-yellow-900 font-bold">⭐</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-1">{festival.name}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <MapPin size={10} />
                                        <span className="truncate">{festival.cityName === 'all' ? 'State-wide' : festival.cityName}</span>
                                    </div>
                                    {festival.approximateDate && (
                                        <div className="flex items-center gap-1 mt-0.5 text-xs text-orange-600 dark:text-orange-400">
                                            <Calendar size={10} />
                                            <span className="truncate">{festival.approximateDate}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <Users size={10} className="text-gray-400" />
                                        <span className="inline-flex gap-0.5">
                                            {Array.from({ length: 4 }, (_, j) => (
                                                <span key={j} className={clsx('w-1.5 h-1.5 rounded-full', j < dots ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-600')} />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
