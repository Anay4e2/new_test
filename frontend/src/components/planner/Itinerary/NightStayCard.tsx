import { FC, useState } from 'react';
import { Moon, Building2, ChevronDown, X, Star, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { NightStayInfo, Hotel } from '@/types';
import { getHotelsByCity } from '@/services/api';

interface NightStayCardProps {
  nightStay: string | NightStayInfo;
  dayCity: string;
}

const isHotelInfo = (ns: string | NightStayInfo): ns is NightStayInfo => {
  return typeof ns === 'object' && ns !== null && 'hotel' in ns;
};

const renderStars = (rating: number) => {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: full }, (_, i) => (
        <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
      ))}
      {hasHalf && <Star size={12} className="fill-amber-400/50 text-amber-400" />}
      <span className="text-xs ml-1 text-gray-500 dark:text-gray-400">{rating}</span>
    </span>
  );
};

export const NightStayCard: FC<NightStayCardProps> = ({ nightStay, dayCity }) => {
  const { t } = useTranslation();
  const [alternativesFor, setAlternativesFor] = useState<string | null>(null);
  const [alternativeHotels, setAlternativeHotels] = useState<Hotel[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  const handleViewAlternatives = async (cityName: string) => {
    if (alternativesFor === cityName) {
      setAlternativesFor(null);
      return;
    }
    setAlternativesFor(cityName);
    setLoadingAlternatives(true);
    try {
      const hotels = await getHotelsByCity(cityName);
      setAlternativeHotels(hotels);
    } catch {
      setAlternativeHotels([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  if (!isHotelInfo(nightStay)) {
    return (
      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg inline-block">
        <Moon size={14} className="inline text-primary" />
        <span>{t('planner.overnight')} in <strong>{nightStay}</strong></span>
      </div>
    );
  }

  const cityName = nightStay.city || dayCity;

  return (
    <div className="mt-4">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700/70 dark:to-slate-700/50 border border-indigo-100 dark:border-slate-600 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white dark:bg-slate-600 p-2 rounded-lg shadow-sm text-primary shrink-0">
            <Building2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Moon size={12} className="text-primary shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{t('planner.overnight')}</span>
            </div>
            <div className="font-bold text-text dark:text-white mt-1">{nightStay.hotel.name}</div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {renderStars(nightStay.hotel.rating)}
              <span className="text-sm font-semibold text-primary">₹{nightStay.hotel.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-gray-500 dark:text-gray-400">/night</span></span>
              <span className={clsx(
                'text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                nightStay.hotel.tier === 'budget' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                nightStay.hotel.tier === 'standard' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                nightStay.hotel.tier === 'premium' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
              )}>{nightStay.hotel.tier}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {nightStay.hotel.amenities.slice(0, 4).map((a: string, i: number) => (
                <span key={i} className="text-xs bg-white dark:bg-slate-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-500">{a}</span>
              ))}
              {nightStay.hotel.amenities.length > 4 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 px-1">+{nightStay.hotel.amenities.length - 4} more</span>
              )}
            </div>
            <button
              onClick={() => handleViewAlternatives(cityName)}
              className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              View alternatives
              <ChevronDown size={12} className={clsx('transition-transform', alternativesFor === cityName && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {alternativesFor === cityName && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2 border-t border-gray-200 dark:border-slate-600 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Other Hotels in {cityName}</span>
                      <button onClick={() => setAlternativesFor(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X size={14} />
                      </button>
                    </div>
                    {loadingAlternatives ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 size={12} className="animate-spin" /> Loading...</div>
                    ) : alternativeHotels.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">No alternatives found.</div>
                    ) : (
                      alternativeHotels
                        .filter(h => h.name !== nightStay.hotel.name)
                        .map((hotel, hi) => (
                          <div key={hi} className="flex items-center justify-between bg-white dark:bg-slate-600/50 rounded-lg p-2.5 border border-gray-100 dark:border-slate-500">
                            <div>
                              <div className="text-sm font-medium text-text dark:text-white">{hotel.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {renderStars(hotel.rating)}
                                <span className={clsx(
                                  'text-xs px-1.5 py-0.5 rounded-full capitalize',
                                  hotel.tier === 'budget' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
                                  hotel.tier === 'standard' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                                  hotel.tier === 'premium' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                                )}>{hotel.tier}</span>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-primary">₹{hotel.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-gray-500 dark:text-gray-400">/n</span></div>
                          </div>
                        ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
