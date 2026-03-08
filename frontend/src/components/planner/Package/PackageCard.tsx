import { FC, useState } from 'react';
import { getPackageById } from '../../../services/api';
import type { Package, Place } from '../../../types';

interface PackageCardProps {
    pkg: Package;
    onAddToTrip: (pkg: Package) => void;
    isAdded?: boolean;
}

export const PackageCard: FC<PackageCardProps> = ({ pkg, onAddToTrip, isAdded }) => {
    const [expanded, setExpanded] = useState(false);
    const [details, setDetails] = useState<Place[] | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const handleToggle = async () => {
        if (expanded) { setExpanded(false); return; }
        setExpanded(true);
        if (!details) {
            setLoadingDetails(true);
            try {
                const res = await getPackageById(pkg.id);
                if (res.success && res.data.placesDetails) setDetails(res.data.placesDetails);
            } catch { /* ignore */ }
            setLoadingDetails(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all hover:shadow-xl hover:shadow-orange-500/5">
            {/* Image */}
            {pkg.image && (
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-1 bg-orange-500/80 text-white text-xs font-semibold rounded-full">
                            {pkg.state}
                        </span>
                    </div>
                    {isAdded && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/90 text-white text-xs font-semibold rounded-full">
                            ✓ Added
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{pkg.title}</h3>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                        📅 {pkg.days} Night{pkg.days !== 1 ? 's' : ''} / {pkg.days + 1} Day{pkg.days !== 0 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                        🏙️ {pkg.cities.length} {pkg.cities.length === 1 ? 'City' : 'Cities'}
                    </span>
                </div>

                {/* Route Preview */}
                {pkg.cities.length > 0 && (
                    <div className="text-xs text-gray-400 mb-2">
                        🗺️ {pkg.cities.join(' → ')}
                    </div>
                )}

                {pkg.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{pkg.description}</p>
                )}

                {/* Tags */}
                {pkg.tags && pkg.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {pkg.tags.slice(0, 4).map((tag, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Expandable Details */}
                {expanded && (
                    <div className="mb-3 space-y-2">
                        {loadingDetails ? (
                            <div className="flex items-center gap-2 py-3 justify-center">
                                <div className="w-3.5 h-3.5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                                <span className="text-xs text-gray-500">Loading places...</span>
                            </div>
                        ) : details && details.length > 0 ? (
                            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2">📍 Places Included ({details.length})</p>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                    {details.map((place, i) => (
                                        <div key={place._id} className="flex items-center gap-2 text-xs">
                                            <span className="w-4 h-4 flex items-center justify-center bg-orange-500/20 text-orange-400 text-[9px] font-bold rounded-full flex-shrink-0">{i + 1}</span>
                                            <span className="text-white truncate">{place.name}</span>
                                            <span className="text-gray-500 flex-shrink-0">{place.cityName}</span>
                                            {place.visitDuration && <span className="text-gray-600 flex-shrink-0 ml-auto">⏱ {place.visitDuration}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Stay info */}
                        <div className="bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/20">
                            <p className="text-[10px] font-semibold text-amber-400 uppercase mb-1">🏨 Stay</p>
                            <p className="text-xs text-gray-300">{pkg.cities.join(', ')} — accommodation in each city</p>
                        </div>
                    </div>
                )}

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                        <span className="text-xs text-gray-500">Starting from</span>
                        <div className="text-xl font-bold text-emerald-400">
                            ₹{pkg.price.toLocaleString()}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggle}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                        >
                            {expanded ? 'Less' : 'Details'}
                        </button>
                        {isAdded ? (
                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg text-sm flex items-center gap-1">
                                ✓ Added
                            </span>
                        ) : (
                            <button
                                onClick={() => onAddToTrip(pkg)}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/25"
                            >
                                Add to Trip
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
