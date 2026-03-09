import { FC } from 'react';
import { Coffee, UtensilsCrossed, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { MealRecommendation } from '@/types';

interface MealCardProps {
  meal: MealRecommendation;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  isSwapping: boolean;
  onSwap: () => void;
}

export const MealCard: FC<MealCardProps> = ({ meal, mealType, isSwapping, onSwap }) => {
  const { t } = useTranslation();
  const icon = mealType === 'breakfast'
    ? <Coffee size={14} className="text-amber-600" />
    : <UtensilsCrossed size={14} className="text-orange-600" />;
  const label = t(`planner.${mealType}`);

  return (
    <div className="flex items-center gap-4 bg-orange-50/80 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-xl p-4">
      <div className="bg-white dark:bg-slate-600 p-2 rounded-full shadow-sm shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{label}</span>
          {meal.vegetarian && <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium" title="Vegetarian">🟢 Veg</span>}
        </div>
        <div className="text-sm font-semibold text-text dark:text-white truncate mt-0.5">{meal.restaurant}</div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">{meal.cuisine}</span>
          {meal.mustTry && <span className="text-xs text-orange-600 dark:text-orange-400">Try: {meal.mustTry}</span>}
          <span className="text-xs font-medium text-primary">₹{meal.cost}</span>
        </div>
      </div>
      <button
        onClick={onSwap}
        disabled={isSwapping}
        className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-800/30 rounded-full transition-colors shrink-0 text-gray-400 hover:text-orange-600"
        title="Swap restaurant"
      >
        <RefreshCw size={14} className={clsx(isSwapping && 'animate-spin')} />
      </button>
    </div>
  );
};
