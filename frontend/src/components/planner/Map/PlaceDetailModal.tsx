import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Clock, IndianRupee, MapPin, Tag, Sun, Plus, Loader2 } from 'lucide-react';
import { PhotoGallery } from '../../common/PhotoGallery';
import { ReviewsSection } from './ReviewsSection';
import { getPlacePhotos } from '../../../services/api';
import clsx from 'clsx';

interface PlaceDetailModalProps {
    place: {
        _id?: string;
        name: string;
        cityName?: string;
        city?: string;
        type?: string;
        description?: string;
        rating?: number;
        timeRequired?: number;
        visitDuration?: string;
        entryFee?: string;
        bestTime?: string;
        bestTimeOfDay?: string;
        tags?: string[];
        images?: string[];
        thumbnailUrl?: string;
        imageUrl?: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToTrip?: (placeId: string) => void;
    showAddButton?: boolean;
}

export const PlaceDetailModal: FC<PlaceDetailModalProps> = ({
    place,
    isOpen,
    onClose,
    onAddToTrip,
    showAddButton = false,
}) => {
    const [googlePhotos, setGooglePhotos] = useState<string[]>([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    useEffect(() => {
        if (!isOpen || !place?.name) {
            setGooglePhotos([]);
            return;
        }

        let cancelled = false;
        setLoadingPhotos(true);

        getPlacePhotos(place.name, place.cityName || place.city)
            .then((data) => {
                if (!cancelled && data.photos.length > 0) {
                    setGooglePhotos(data.photos);
                }
            })
            .catch(() => { /* fallback to existing images */ })
            .finally(() => {
                if (!cancelled) setLoadingPhotos(false);
            });

        return () => { cancelled = true; };
    }, [isOpen, place?.name, place?.cityName, place?.city]);

    if (!place) return null;

    // Prefer Google Places photos, fall back to existing images
    const fallbackImages = place.images && place.images.length > 0
        ? place.images
        : place.thumbnailUrl
            ? [place.thumbnailUrl]
            : place.imageUrl
                ? [place.imageUrl]
                : [];

    const images = googlePhotos.length > 0 ? googlePhotos : fallbackImages;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[5000] bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[5001] flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <div
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header with close */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{place.name}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                        <MapPin size={12} />
                                        {place.cityName || place.city}
                                        {place.type && <> • <span className="text-blue-500">{place.type}</span></>}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Scrollable content */}
                            <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-4 space-y-4">
                                {/* Photo Gallery */}
                                {loadingPhotos && images.length === 0 ? (
                                    <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-xl">
                                        <Loader2 size={24} className="animate-spin text-blue-500" />
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading photos...</span>
                                    </div>
                                ) : images.length > 0 ? (
                                    <PhotoGallery images={images} alt={place.name} className="h-48" />
                                ) : null}

                                {/* Rating & Quick Info */}
                                <div className="flex flex-wrap gap-3">
                                    {place.rating && (
                                        <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                                            <Star size={14} className="text-amber-500 fill-amber-500" />
                                            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{place.rating}</span>
                                        </div>
                                    )}
                                    {(place.timeRequired || place.visitDuration) && (
                                        <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                            <Clock size={14} className="text-blue-500" />
                                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                                {place.visitDuration || `${place.timeRequired}h`}
                                            </span>
                                        </div>
                                    )}
                                    {place.entryFee && (
                                        <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                                            <IndianRupee size={14} className="text-green-500" />
                                            <span className="text-sm font-medium text-green-700 dark:text-green-400">{place.entryFee}</span>
                                        </div>
                                    )}
                                    {(place.bestTime || place.bestTimeOfDay) && (
                                        <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                                            <Sun size={14} className="text-purple-500" />
                                            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                                                {place.bestTime || place.bestTimeOfDay}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {place.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {place.description}
                                    </p>
                                )}

                                {/* Tags */}
                                {place.tags && place.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {place.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium"
                                            >
                                                <Tag size={10} />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Reviews Section */}
                                {place._id && (
                                    <ReviewsSection
                                        placeId={place._id}
                                        placeName={place.name}
                                        cityName={place.cityName || place.city}
                                    />
                                )}

                                {/* Add to Trip button */}
                                {showAddButton && onAddToTrip && place._id && (
                                    <button
                                        onClick={() => onAddToTrip(place._id!)}
                                        className={clsx(
                                            'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                                            'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                                        )}
                                    >
                                        <Plus size={18} />
                                        Add to Trip
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
