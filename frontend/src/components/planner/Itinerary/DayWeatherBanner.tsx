import { FC } from 'react';
import { CloudRain, Thermometer, Sun, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

interface WeatherInfo {
  temp: number;
  condition: string;
  icon: string;
  advisory?: string;
}

interface DayWeatherBannerProps {
  weather: WeatherInfo;
}

export const DayWeatherBanner: FC<DayWeatherBannerProps> = ({ weather }) => (
  <div className="mb-4 space-y-2">
    <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-700/70 dark:to-slate-700/50 border border-sky-100 dark:border-slate-600 rounded-xl px-4 py-3">
      <div className="bg-white dark:bg-slate-600 p-2 rounded-full shadow-sm">
        {weather.condition.toLowerCase().includes('rain')
          ? <CloudRain size={18} className="text-blue-500" />
          : weather.temp >= 38
            ? <Thermometer size={18} className="text-red-500" />
            : <Sun size={18} className="text-amber-500" />
        }
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-800 dark:text-white">{weather.temp}°C</span>
          <span className="text-sm text-gray-600 dark:text-gray-300">{weather.condition}</span>
        </div>
      </div>
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
        alt={weather.condition}
        className="w-10 h-10 opacity-80"
      />
    </div>
    {weather.advisory && (
      <div className={clsx(
        'flex items-start gap-2 rounded-lg px-4 py-2.5 text-sm',
        weather.temp >= 42
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
          : weather.condition.toLowerCase().includes('heavy rain')
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400'
      )}>
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>{weather.advisory}</span>
      </div>
    )}
  </div>
);
