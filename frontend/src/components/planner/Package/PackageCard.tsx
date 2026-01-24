import { FC } from 'react';
import type { Package } from '../../../types';

interface PackageCardProps {
    pkg: Package;
    onAddToTrip: (pkg: Package) => void;
}

export const PackageCard: FC<PackageCardProps> = ({ pkg, onAddToTrip }) => {
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
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">{pkg.title}</h3>

                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                        📅 {pkg.days} {pkg.days === 1 ? 'Day' : 'Days'}
                    </span>
                    <span className="flex items-center gap-1">
                        🏙️ {pkg.cities.length} {pkg.cities.length === 1 ? 'City' : 'Cities'}
                    </span>
                </div>

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

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                        <span className="text-xs text-gray-500">Starting from</span>
                        <div className="text-xl font-bold text-emerald-400">
                            ₹{pkg.price.toLocaleString()}
                        </div>
                    </div>
                    <button
                        onClick={() => onAddToTrip(pkg)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-orange-500/25"
                    >
                        Add to Trip
                    </button>
                </div>
            </div>
        </div>
    );
};
