import { FC, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryProps {
    images: string[];
    alt?: string;
    className?: string;
}

export const PhotoGallery: FC<PhotoGalleryProps> = ({ images, alt = 'Photo', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
    };

    const closeLightbox = () => setIsOpen(false);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, goNext, goPrev]);

    // Lock body scroll when lightbox open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleImageLoad = (index: number) => {
        setLoadedImages((prev) => new Set(prev).add(index));
    };

    if (!images || images.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-xl ${className}`}>
                <ImageIcon size={32} className="text-gray-300 dark:text-gray-500" />
            </div>
        );
    }

    const displayImages = images.slice(0, 4);
    const extraCount = images.length - 4;

    return (
        <>
            {/* Thumbnail Grid */}
            <div className={`grid gap-1 rounded-xl overflow-hidden cursor-pointer ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${className}`}>
                {displayImages.map((src, idx) => (
                    <div
                        key={idx}
                        className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-slate-700"
                        onClick={() => openLightbox(idx)}
                    >
                        {/* Loading skeleton */}
                        {!loadedImages.has(idx) && (
                            <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-slate-600" />
                        )}
                        <img
                            src={src}
                            alt={`${alt} ${idx + 1}`}
                            loading="lazy"
                            onLoad={() => handleImageLoad(idx)}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {/* "+N more" overlay on last thumbnail */}
                        {idx === 3 && extraCount > 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">+{extraCount} more</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
                        onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
                    >
                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Image counter */}
                        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/10 rounded-full text-white text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>

                        {/* Previous button */}
                        {images.length > 1 && (
                            <button
                                onClick={goPrev}
                                className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <ChevronLeft size={28} />
                            </button>
                        )}

                        {/* Main image with swipe */}
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_e, info) => {
                                if (info.offset.x < -80) goNext();
                                else if (info.offset.x > 80) goPrev();
                            }}
                            className="max-w-[90vw] max-h-[85vh] select-none"
                        >
                            <img
                                src={images[currentIndex]}
                                alt={`${alt} ${currentIndex + 1}`}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                draggable={false}
                            />
                        </motion.div>

                        {/* Next button */}
                        {images.length > 1 && (
                            <button
                                onClick={goNext}
                                className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <ChevronRight size={28} />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
