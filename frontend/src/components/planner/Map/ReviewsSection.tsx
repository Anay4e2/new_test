import { FC, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Trash2, ChevronDown, MessageSquare } from 'lucide-react';
import { StarRating } from '../../common/StarRating';
import { ReviewForm } from '../../common/ReviewForm';
import { getReviewsForPlace, markReviewHelpful, deleteReview } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import type { Review } from '../../../types';
import clsx from 'clsx';

interface ReviewsSectionProps {
    placeId: string;
    placeName: string;
    cityName?: string;
}

type SortOption = 'recent' | 'highest' | 'helpful';

export const ReviewsSection: FC<ReviewsSectionProps> = ({ placeId, placeName, cityName }) => {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [distribution, setDistribution] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const [sort, setSort] = useState<SortOption>('recent');
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchReviews = useCallback(async (resetOffset = true) => {
        setLoading(true);
        try {
            const offset = resetOffset ? 0 : reviews.length;
            const result = await getReviewsForPlace(placeId, { sort, limit: 10, offset });
            if (resetOffset) {
                setReviews(result.reviews);
            } else {
                setReviews((prev) => [...prev, ...result.reviews]);
            }
            setTotalCount(result.totalCount);
            setDistribution(result.distribution);
            setHasMore(result.hasMore);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [placeId, sort, reviews.length]);

    useEffect(() => {
        fetchReviews(true);
    }, [placeId, sort]);

    const averageRating =
        totalCount > 0
            ? Object.entries(distribution).reduce((sum, [stars, count]) => sum + Number(stars) * count, 0) / totalCount
            : 0;

    const handleHelpful = async (reviewId: string) => {
        try {
            const result = await markReviewHelpful(reviewId);
            setReviews((prev) =>
                prev.map((r) => (r._id === reviewId ? { ...r, helpfulCount: result.helpfulCount } : r))
            );
        } catch {
            // silent
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Delete this review?')) return;
        try {
            await deleteReview(reviewId);
            fetchReviews(true);
        } catch {
            // silent
        }
    };

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'recent', label: 'Most Recent' },
        { value: 'highest', label: 'Highest Rated' },
        { value: 'helpful', label: 'Most Helpful' },
    ];

    return (
        <div className="mt-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-indigo-500" />
                    Reviews
                    {totalCount > 0 && (
                        <span className="text-sm font-normal text-gray-500">({totalCount})</span>
                    )}
                </h3>
                <button
                    onClick={() => setShowForm((prev) => !prev)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                    {showForm ? 'Cancel' : '✏️ Write a Review'}
                </button>
            </div>

            {/* Review Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                    >
                        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-600">
                            <ReviewForm
                                placeId={placeId}
                                placeName={placeName}
                                cityName={cityName}
                                onReviewSubmitted={() => {
                                    setShowForm(false);
                                    fetchReviews(true);
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rating Summary */}
            {totalCount > 0 && (
                <div className="flex items-start gap-6 mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-slate-700">
                    {/* Average */}
                    <div className="text-center shrink-0">
                        <div className="text-3xl font-bold text-gray-800 dark:text-white">
                            {averageRating.toFixed(1)}
                        </div>
                        <StarRating rating={averageRating} size={14} />
                        <div className="text-xs text-gray-500 mt-1">{totalCount} reviews</div>
                    </div>

                    {/* Distribution bars */}
                    <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((stars) => {
                            const count = distribution[stars] || 0;
                            const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                            return (
                                <div key={stars} className="flex items-center gap-2 text-xs">
                                    <span className="w-3 text-gray-600 dark:text-gray-400 font-medium">{stars}</span>
                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-gray-500 dark:text-gray-400">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Sort options */}
            {totalCount > 1 && (
                <div className="flex gap-2 mb-3">
                    {sortOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setSort(opt.value)}
                            className={clsx(
                                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                                sort === opt.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && reviews.length === 0 && (
                <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty state */}
            {!loading && totalCount === 0 && (
                <div className="text-center py-8 px-4">
                    <MessageSquare size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        No reviews yet — be the first!
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                        Write a review
                    </button>
                </div>
            )}

            {/* Review list */}
            <div className="space-y-3">
                <AnimatePresence>
                    {reviews.map((review) => (
                        <motion.div
                            key={review._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                            {review.userName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                            {review.userName}
                                        </span>
                                    </div>
                                    <StarRating rating={review.rating} size={14} className="mt-1" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    {user && review.userId === (user as any)._id && (
                                        <button
                                            onClick={() => handleDelete(review._id)}
                                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete review"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            {review.title && (
                                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                                    {review.title}
                                </p>
                            )}
                            {review.comment && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {review.comment}
                                </p>
                            )}

                            {/* Visit date */}
                            {review.visitDate && (
                                <p className="text-[10px] text-gray-400 mt-2">
                                    Visited:{' '}
                                    {new Date(review.visitDate).toLocaleDateString('en-IN', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                                <button
                                    onClick={() => handleHelpful(review._id)}
                                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                    <ThumbsUp size={12} />
                                    Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Load more */}
            {hasMore && (
                <button
                    onClick={() => fetchReviews(false)}
                    disabled={loading}
                    className="w-full mt-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    <ChevronDown size={14} />
                    {loading ? 'Loading...' : 'Load More Reviews'}
                </button>
            )}
        </div>
    );
};
