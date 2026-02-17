import { FC, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSharedTrip } from '@/services/api';
import { ItineraryView } from '@/components/planner/Itinerary/ItineraryView';
import { Loader2, MapPin, Compass } from 'lucide-react';
import type { TripResult } from '@/types';

export const SharedTrip: FC = () => {
    const { shareId } = useParams<{ shareId: string }>();
    const [tripResult, setTripResult] = useState<TripResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!shareId) return;

        const fetchTrip = async () => {
            try {
                const res = await getSharedTrip(shareId);
                if (res.success) {
                    setTripResult(res.tripResult);
                } else {
                    setError('Trip not found or has expired.');
                }
            } catch {
                setError('Failed to load shared trip. It may have expired.');
            } finally {
                setLoading(false);
            }
        };

        fetchTrip();
    }, [shareId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading shared trip...</p>
                </div>
            </div>
        );
    }

    if (error || !tripResult) {
        return (
            <div className="min-h-screen bg-neutral dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <MapPin size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Trip Not Found</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error || 'This shared trip link may have expired or is invalid.'}</p>
                    <Link
                        to="/plan"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Compass size={16} />
                        Plan Your Own Trip
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral dark:bg-slate-900 py-8 px-4">
            {/* Shared trip banner */}
            <div className="max-w-2xl mx-auto mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-3 flex items-center justify-between">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        📤 You're viewing a shared trip itinerary
                    </p>
                    <Link
                        to="/plan"
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Plan your own →
                    </Link>
                </div>
            </div>

            {/* Read-only itinerary */}
            <div className="max-w-2xl mx-auto">
                <ItineraryView
                    result={tripResult}
                    onReset={() => window.location.href = '/plan'}
                />
            </div>
        </div>
    );
};
