import { FC, useState } from 'react';
import { Send, LogIn } from 'lucide-react';
import { StarRating } from './StarRating';
import { useAuthStore } from '../../stores/authStore';
import { createReview } from '../../services/api';
import clsx from 'clsx';

interface ReviewFormProps {
    placeId: string;
    placeName: string;
    cityName?: string;
    onReviewSubmitted: () => void;
}

export const ReviewForm: FC<ReviewFormProps> = ({
    placeId,
    placeName,
    cityName,
    onReviewSubmitted,
}) => {
    const { isAuthenticated } = useAuthStore();
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating) {
            setError('Please select a rating');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await createReview({
                placeId,
                placeName,
                cityName,
                rating,
                title: title.trim(),
                comment: comment.trim(),
                visitDate: visitDate || undefined,
            });
            setSuccess(true);
            setRating(0);
            setTitle('');
            setComment('');
            setVisitDate('');
            onReviewSubmitted();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="text-center py-6 px-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
                <LogIn size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <a href="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Log in
                    </a>{' '}
                    to leave a review
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating:</span>
                <StarRating rating={rating} interactive onChange={setRating} size={24} />
                {rating > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </span>
                )}
            </div>

            <input
                type="text"
                placeholder="Review title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />

            <textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            />

            <div className="flex items-center justify-between gap-3">
                <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    title="Visit date (optional)"
                />

                <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                        rating > 0 && !submitting
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    )}
                >
                    <Send size={14} />
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
            {success && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✅ Review submitted successfully!
                </p>
            )}

            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-right">
                {comment.length}/1000 characters
            </p>
        </form>
    );
};
