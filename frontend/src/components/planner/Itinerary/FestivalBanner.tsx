import { FC } from 'react';
import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface FestivalInfo {
  name: string;
  type: string;
  description: string;
  crowdLevel: string;
  highlights: string[];
  advisory?: string;
}

interface FestivalBannerProps {
  festival: FestivalInfo;
}

const festivalColors: Record<string, { bg: string; border: string; text: string; badge: string; icon: string }> = {
  religious: { bg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20', border: 'border-orange-200 dark:border-orange-800/40', text: 'text-orange-800 dark:text-orange-300', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', icon: '🟠' },
  cultural: { bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-800 dark:text-blue-300', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', icon: '🔵' },
  fair: { bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20', border: 'border-green-200 dark:border-green-800/40', text: 'text-green-800 dark:text-green-300', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', icon: '🟢' },
  music: { bg: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20', border: 'border-purple-200 dark:border-purple-800/40', text: 'text-purple-800 dark:text-purple-300', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', icon: '🟣' },
  food: { bg: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-800 dark:text-red-300', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: '🔴' },
  art: { bg: 'from-pink-50 to-fuchsia-50 dark:from-pink-900/20 dark:to-fuchsia-900/20', border: 'border-pink-200 dark:border-pink-800/40', text: 'text-pink-800 dark:text-pink-300', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400', icon: '🎨' },
};

const crowdDots: Record<string, number> = { extreme: 4, high: 3, moderate: 2, low: 1 };

export const FestivalBanner: FC<FestivalBannerProps> = ({ festival }) => {
  const colors = festivalColors[festival.type] || festivalColors.cultural;
  const dots = crowdDots[festival.crowdLevel] || 2;

  return (
    <div className={clsx('mb-4 rounded-xl border overflow-hidden', colors.border)}>
      <div className={clsx('bg-gradient-to-r px-4 py-3', colors.bg)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{colors.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('font-bold text-sm', colors.text)}>{festival.name}</span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium capitalize', colors.badge)}>{festival.type}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Crowd:</span>
              <span className="inline-flex gap-0.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <span key={i} className={clsx('w-2 h-2 rounded-full', i < dots ? 'bg-orange-400' : 'bg-gray-200 dark:bg-gray-600')} />
                ))}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{festival.crowdLevel}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{festival.description}</p>
        {festival.highlights && festival.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {festival.highlights.slice(0, 3).map((h: string, i: number) => (
              <span key={i} className="text-xs bg-white/60 dark:bg-slate-700/50 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300">✦ {h}</span>
            ))}
          </div>
        )}
        {festival.advisory && (
          <div className="flex items-start gap-1.5 mt-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>{festival.advisory}</span>
          </div>
        )}
      </div>
    </div>
  );
};
