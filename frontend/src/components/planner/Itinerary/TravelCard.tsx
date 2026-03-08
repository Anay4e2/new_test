import { FC, useState } from 'react';
import { Car, Train, Plane, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import TrainStatusComponent from '../Transport/TrainStatus';

interface TravelInfo {
  from: string;
  to: string;
  distance: number;
  duration: number;
  mode: string;
  isInterState?: boolean;
  fromState?: string;
  toState?: string;
}

interface TravelCardProps {
  travel: TravelInfo;
  dayNumber: number;
  date?: string;
  maxTravelHours?: number;
}

export const TravelCard: FC<TravelCardProps> = ({ travel, date, maxTravelHours }) => {
  const [trackingTrain, setTrackingTrain] = useState(false);
  const { t } = useTranslation();
  const exceedsLimit = maxTravelHours != null && travel.duration > maxTravelHours;

  return (
    <div className="mt-6">
      <div className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border',
        exceedsLimit
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 ring-2 ring-red-300/50'
          : travel.isInterState
          ? 'bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-900/30 dark:to-purple-900/30 border-amber-200 dark:border-amber-700'
          : 'bg-secondary/20 dark:bg-slate-700/50 border-secondary/30 dark:border-slate-600'
      )}>
        <div className={clsx(
          'p-2 rounded-full shadow-sm',
          exceedsLimit
            ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
            : travel.isInterState
            ? 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
            : 'bg-white dark:bg-slate-600 text-primary'
        )}>
          {exceedsLimit ? <AlertTriangle size={20} /> : travel.mode === 'Flight' ? <Plane size={20} /> : travel.mode === 'Train' ? <Train size={20} /> : <Car size={20} />}
        </div>
        <div className="text-sm flex-1">
          <div className="font-bold text-text dark:text-white">
            {travel.isInterState ? '🌐 Inter-State: ' : ''}{t('planner.travelTo')} {travel.to}
          </div>
          <div className="text-xs opacity-80">
            {Math.round(travel.distance)}km • approx {Math.round(travel.duration)}h • {travel.mode}
          </div>
          {travel.isInterState && travel.fromState && travel.toState && (
            <div className="text-xs mt-1 font-medium text-amber-700 dark:text-amber-400">
              {travel.fromState.replace('_', ' ')} → {travel.toState.replace('_', ' ')}
            </div>
          )}
          {exceedsLimit && (
            <div className="text-xs mt-1 font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} />
              Exceeds {maxTravelHours}h daily travel limit ({Math.round(travel.duration)}h)
            </div>
          )}
        </div>
        {travel.mode === 'Train' && (
          <button
            onClick={() => setTrackingTrain(!trackingTrain)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              trackingTrain
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50'
            )}
          >
            <Train size={14} />
            {trackingTrain ? 'Hide Status' : 'Track Train'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {trackingTrain && travel.mode === 'Train' && (
          <TrainStatusComponent
            fromCity={travel.from}
            toCity={travel.to}
            date={date}
            onClose={() => setTrackingTrain(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
