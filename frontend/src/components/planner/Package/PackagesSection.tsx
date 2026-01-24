import { FC, useEffect, useState } from 'react';
import { PackageCard } from './PackageCard';
import { getPackages, getPackageById } from '../../../services/api';
import { useTripStore } from '../../../stores/tripStore';
import type { Package, Place } from '../../../types';

export const PackagesSection: FC = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { addPlace } = useTripStore();

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getPackages();
            if (response.success) {
                setPackages(response.data);
            }
        } catch (err) {
            console.error('Error fetching packages:', err);
            setError('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToTrip = async (pkg: Package) => {
        try {
            // Fetch package with place details
            const response = await getPackageById(pkg.id);
            if (response.success && response.data.placesDetails) {
                // Add each place to the trip
                response.data.placesDetails.forEach((place: Place) => {
                    addPlace(place);
                });
            }
        } catch (err) {
            console.error('Error adding package to trip:', err);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-neutral-900/95 p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-gray-400">Loading packages...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-neutral-900/95 p-6">
                <div className="text-red-400 text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p>{error}</p>
                    <button
                        onClick={fetchPackages}
                        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (packages.length === 0) {
        return (
            <div className="h-full flex flex-col bg-neutral-900/95 backdrop-blur-lg overflow-hidden">
                <div className="p-6 text-center">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-white mb-2">No Packages Available</h3>
                    <p className="text-gray-400 text-sm">
                        Check back later for curated travel packages!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-neutral-900/95 backdrop-blur-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Pre-built Packages</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Select a curated package to quickly plan your trip
                </p>
            </div>

            {/* Packages Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    {packages.map(pkg => (
                        <PackageCard
                            key={pkg._id}
                            pkg={pkg}
                            onAddToTrip={handleAddToTrip}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
