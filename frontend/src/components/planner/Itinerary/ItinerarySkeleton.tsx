import { FC } from 'react';

const Pulse: FC<{ className?: string }> = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-700 rounded ${className || ''}`} />
);

export const ItinerarySkeleton: FC = () => {
    return (
        <div className="p-4 space-y-6">
            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-gray-300 to-gray-200 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 space-y-3">
                <Pulse className="h-6 w-48" />
                <Pulse className="h-4 w-64" />
                <div className="flex gap-4 mt-4">
                    <Pulse className="h-8 w-8 rounded-full" />
                    <Pulse className="h-8 w-8 rounded-full" />
                    <Pulse className="h-8 w-8 rounded-full" />
                </div>
            </div>

            {/* Summary skeleton */}
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 space-y-2">
                        <Pulse className="h-3 w-12" />
                        <Pulse className="h-5 w-16" />
                    </div>
                ))}
            </div>

            {/* Day cards skeleton */}
            {[1, 2, 3].map(day => (
                <div key={day} className="bg-white dark:bg-slate-800 rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-slate-700">
                    {/* Day header */}
                    <div className="flex items-center gap-3">
                        <Pulse className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Pulse className="h-4 w-32" />
                            <Pulse className="h-3 w-24" />
                        </div>
                    </div>

                    {/* Weather bar */}
                    <Pulse className="h-10 w-full rounded-lg" />

                    {/* Activities */}
                    {[1, 2].map(act => (
                        <div key={act} className="flex gap-4 p-3">
                            <Pulse className="w-16 h-16 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Pulse className="h-4 w-40" />
                                <Pulse className="h-3 w-56" />
                                <Pulse className="h-3 w-32" />
                            </div>
                        </div>
                    ))}

                    {/* Meal */}
                    <div className="flex gap-3 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
                        <Pulse className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Pulse className="h-3 w-24" />
                            <Pulse className="h-4 w-36" />
                        </div>
                    </div>
                </div>
            ))}

            {/* Bottom text */}
            <div className="text-center py-4">
                <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse">Generating your personalized itinerary...</p>
            </div>
        </div>
    );
};
