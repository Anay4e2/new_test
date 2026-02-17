import { Request, Response } from 'express';
import Review from '../models/Review';
import Place from '../models/Place';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// Sanitize text: strip HTML tags
const sanitize = (text: string): string =>
    text.replace(/<[^>]*>/g, '').trim();

// Recalculate average rating for a place
const recalculateRating = async (placeId: string): Promise<void> => {
    const result = await Review.aggregate([
        { $match: { placeId } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 },
            },
        },
    ]);

    if (result.length > 0) {
        await Place.findByIdAndUpdate(placeId, {
            averageRating: Math.round(result[0].averageRating * 10) / 10,
            reviewCount: result[0].reviewCount,
            rating: Math.round(result[0].averageRating * 10) / 10,
        });
    } else {
        await Place.findByIdAndUpdate(placeId, {
            averageRating: 0,
            reviewCount: 0,
            rating: 4.0, // reset to default
        });
    }
};

// POST /api/reviews — create or update review
export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { placeId, placeName, cityName, rating, title, comment, visitDate } = req.body;

        if (!placeId || !rating) {
            res.status(400).json({ success: false, message: 'placeId and rating are required' });
            return;
        }

        if (rating < 1 || rating > 5) {
            res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
            return;
        }

        // Get user name
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const reviewData = {
            userId,
            userName: user.name,
            placeId,
            placeName: sanitize(placeName || ''),
            cityName: sanitize(cityName || ''),
            rating,
            title: sanitize(title || ''),
            comment: sanitize(comment || ''),
            visitDate: visitDate ? new Date(visitDate) : undefined,
        };

        // Upsert: create or update
        const review = await Review.findOneAndUpdate(
            { userId, placeId },
            reviewData,
            { upsert: true, new: true, runValidators: true }
        );

        // Recalculate place rating
        await recalculateRating(placeId);

        res.status(201).json({ success: true, review });
    } catch (error: any) {
        console.error('Error creating review:', error);
        if (error.code === 11000) {
            res.status(409).json({ success: false, message: 'You have already reviewed this place' });
            return;
        }
        res.status(500).json({ success: false, message: 'Failed to create review' });
    }
};

// GET /api/reviews/place/:placeId — get reviews for a place
export const getReviewsForPlace = async (req: Request, res: Response): Promise<void> => {
    try {
        const { placeId } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const offset = parseInt(req.query.offset as string) || 0;
        const sort = (req.query.sort as string) || 'recent';

        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        if (sort === 'highest') sortOption = { rating: -1, createdAt: -1 };
        if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

        const [reviews, totalCount, ratingDistribution] = await Promise.all([
            Review.find({ placeId })
                .sort(sortOption)
                .skip(offset)
                .limit(limit)
                .lean(),
            Review.countDocuments({ placeId }),
            Review.aggregate([
                { $match: { placeId } },
                { $group: { _id: '$rating', count: { $sum: 1 } } },
                { $sort: { _id: -1 } },
            ]),
        ]);

        // Build distribution map
        const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratingDistribution.forEach((item: any) => {
            distribution[item._id] = item.count;
        });

        res.json({
            success: true,
            reviews,
            totalCount,
            distribution,
            hasMore: offset + limit < totalCount,
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

// GET /api/reviews/my — get my reviews
export const getMyReviews = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const reviews = await Review.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching my reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
};

// POST /api/reviews/:id/helpful — mark review as helpful
export const markHelpful = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const review = await Review.findByIdAndUpdate(
            id,
            { $inc: { helpfulCount: 1 } },
            { new: true }
        );

        if (!review) {
            res.status(404).json({ success: false, message: 'Review not found' });
            return;
        }

        res.json({ success: true, helpfulCount: review.helpfulCount });
    } catch (error) {
        console.error('Error marking helpful:', error);
        res.status(500).json({ success: false, message: 'Failed to mark review as helpful' });
    }
};

// DELETE /api/reviews/:id — delete own review
export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const { id } = req.params;
        const review = await Review.findById(id);

        if (!review) {
            res.status(404).json({ success: false, message: 'Review not found' });
            return;
        }

        if (review.userId.toString() !== userId) {
            res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
            return;
        }

        const placeId = review.placeId;
        await Review.findByIdAndDelete(id);

        // Recalculate place rating
        await recalculateRating(placeId);

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};
