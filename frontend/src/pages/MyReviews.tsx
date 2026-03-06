import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { getMyReviews, deleteReview, updateReviewApi } from '@/services/api';
import type { Review } from '@/types';
import { ArrowLeft, Star, Trash2, MapPin, Calendar, Loader2, MessageSquare, Pencil, Check, X } from 'lucide-react';
import clsx from 'clsx';

export const MyReviews: FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(0);
    const [editTitle, setEditTitle] = useState('');
    const [editComment, setEditComment] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await getMyReviews();
            if (res.success) setReviews(res.reviews);
        } catch {
            toast.error('Failed to load reviews.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await deleteReview(id);
            if (res.success) {
                setReviews(prev => prev.filter(r => r._id !== id));
                toast.success('Review deleted');
            }
        } catch {
            toast.error('Failed to delete review.');
        } finally {
            setDeletingId(null);
        }
    };

    const startEdit = (review: Review) => {
        setEditingId(review._id);
        setEditRating(review.rating);
        setEditTitle(review.title || '');
        setEditComment(review.comment || '');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditRating(0);
        setEditTitle('');
        setEditComment('');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSavingEdit(true);
        try {
            const res = await updateReviewApi(editingId, {
                rating: editRating,
                title: editTitle.trim(),
                comment: editComment.trim(),
            });
            if (res.success) {
                setReviews(prev => prev.map(r => r._id === editingId ? { ...r, ...res.review } : r));
                toast.success('Review updated');
                cancelEdit();
            }
        } catch {
            toast.error('Failed to update review.');
        } finally {
            setSavingEdit(false);
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={clsx(s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
            ))}
        </div>
    );

    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6">
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">My Reviews</h1>

                {/* Stats */}
                {!loading && reviews.length > 0 && (
                    <div className="flex items-center gap-6 mb-6 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><MessageSquare size={14} /> {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {avgRating} avg rating</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-blue-500" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                        <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
                        <p className="text-lg font-medium">No reviews yet</p>
                        <p className="text-sm mt-1">Your reviews will appear here after you rate places.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <div key={review._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                                {editingId === review._id ? (
                                    /* Inline Edit Form */
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rating</label>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button key={s} type="button" onClick={() => setEditRating(s)} className="focus:outline-none">
                                                        <Star size={20} className={clsx(s <= editRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comment</label>
                                            <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveEdit} disabled={savingEdit || editRating === 0} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                                                {savingEdit ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                Save
                                            </button>
                                            <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <X size={12} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal View */
                                    <>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {renderStars(review.rating)}
                                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{review.rating}/5</span>
                                        </div>
                                        {review.title && (
                                            <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{review.title}</h3>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {review.placeName}{review.cityName && `, ${review.cityName}`}</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => startEdit(review)}
                                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors text-gray-300 hover:text-blue-500"
                                            aria-label="Edit review"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review._id)}
                                            disabled={deletingId === review._id}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors text-gray-300 hover:text-red-500"
                                            aria-label="Delete review"
                                        >
                                            {deletingId === review._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        </button>
                                    </div>
                                </div>

                                {review.comment && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">{review.comment}</p>
                                )}

                                {review.photos && review.photos.length > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto">
                                        {review.photos.map((photo, i) => (
                                            <img key={i} src={photo} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                                        ))}
                                    </div>
                                )}

                                {review.helpfulCount > 0 && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{review.helpfulCount} people found this helpful</p>
                                )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
