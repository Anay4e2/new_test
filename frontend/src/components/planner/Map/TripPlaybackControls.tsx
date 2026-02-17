import { FC } from 'react';
import { Play, Pause, Maximize, ChevronLeft, ChevronRight } from 'lucide-react';

interface TripPlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    speed: number;
    onSpeedChange: (speed: number) => void;
    progress: number;
    currentDayLabel: string;
    totalDays: number;
    activeDay: number | null;
    onDayChange: (day: number) => void;
    onFitAll: () => void;
    hasRoute: boolean;
}

const SPEEDS = [1, 2, 5];

export const TripPlaybackControls: FC<TripPlaybackControlsProps> = ({
    isPlaying,
    onPlayPause,
    speed,
    onSpeedChange,
    progress,
    currentDayLabel,
    totalDays,
    activeDay,
    onDayChange,
    onFitAll,
    hasRoute,
}) => {
    if (!hasRoute) return null;

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 pointer-events-auto">
            {/* Day label */}
            {currentDayLabel && (
                <div className="bg-black/70 backdrop-blur-lg text-white text-xs px-3 py-1.5 rounded-full border border-white/10 shadow-lg font-medium">
                    {currentDayLabel}
                </div>
            )}

            {/* Main controls bar */}
            <div className="bg-black/75 backdrop-blur-xl rounded-2xl border border-white/15 shadow-2xl px-3 py-2 flex items-center gap-2">
                {/* Prev Day */}
                <button
                    onClick={() => activeDay !== null && activeDay > 1 && onDayChange(activeDay - 1)}
                    disabled={activeDay === null || activeDay <= 1}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Previous Day"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Play / Pause */}
                <button
                    onClick={onPlayPause}
                    className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all active:scale-90"
                    title={isPlaying ? 'Pause' : 'Play Trip'}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>

                {/* Next Day */}
                <button
                    onClick={() => activeDay !== null && activeDay < totalDays && onDayChange(activeDay + 1)}
                    disabled={activeDay === null || activeDay >= totalDays}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Next Day"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Separator */}
                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Progress bar */}
                <div className="w-24 sm:w-32 h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-100"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Speed selector */}
                <div className="flex items-center gap-0.5">
                    {SPEEDS.map(s => (
                        <button
                            key={s}
                            onClick={() => onSpeedChange(s)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${speed === s
                                    ? 'bg-blue-500 text-white'
                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-white/20 mx-1" />

                {/* Fit All */}
                <button
                    onClick={onFitAll}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="Fit Entire Trip"
                >
                    <Maximize size={16} />
                </button>
            </div>
        </div>
    );
};
