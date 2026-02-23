import { Request, Response } from 'express';
import SavedTrip from '../models/SavedTrip';
import User from '../models/User';
import Review from '../models/Review';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

// GET /api/feed â€” paginated public trips
export const getPublicTrips = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sort = 'recent',
            state,
            duration,
            budget,
            tag,
            page = '1',
            limit = '10',
        } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(30, Math.max(1, parseInt(limit as string, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Build query
        const query: any = { isPublic: true };

        // Filter by state
        if (state) {
            query['tripRequest.stateCode'] = (state as string).toUpperCase();
        }

        // Filter by budget
        if (budget && ['budget', 'standard', 'premium'].includes(budget as string)) {
            query['tripRequest.budget'] = budget;
        }

        // Filter by tag
        if (tag) {
            query.tags = { $in: (tag as string).split(',') };
        }

        // Filter by duration range (e.g., "3-5")
        if (duration) {
            const [minStr, maxStr] = (duration as string).split('-');
            const minDays = parseInt(minStr, 10);
            const maxDays = parseInt(maxStr || minStr, 10);
            if (!isNaN(minDays) && !isNaN(maxDays)) {
                query['tripRequest.duration'] = { $gte: minDays, $lte: maxDays };
            }
        }

        // Sort options
        let sortOption: any = { createdAt: -1 }; // recent
        if (sort === 'popular') {
            sortOption = { likes: -1, createdAt: -1 };
        } else if (sort === 'trending') {
            // trending = (likes * 2 + viewCount) for recently updated trips
            sortOption = { likes: -1, updatedAt: -1 };
        }

        const [trips, total] = await Promise.all([
            SavedTrip.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .populate('userId', 'name createdAt')
                .lean(),
            SavedTrip.countDocuments(query),
        ]);

        // Strip sensitive data & shape response
        const publicTrips = trips.map((trip: any) => ({
            _id: trip._id,
            title: trip.title,
            tripRequest: {
                stateCode: trip.tripRequest?.stateCode,
                stateCodes: trip.tripRequest?.stateCodes,
                duration: trip.tripRequest?.duration,
                budget: trip.tripRequest?.budget,
                travelStyle: trip.tripRequest?.travelStyle,
            },
            tripResult: {
                itinerary: (trip.tripResult?.itinerary || []).map((day: any) => ({
                    day: day.day,
                    city: day.city,
                    activities: (day.activities || []).slice(0, 3).map((a: any) => ({
                        name: a.name,
                        type: a.type,
                    })),
                })),
                summary: trip.tripResult?.summary,
            },
            likes: trip.likes || 0,
            tags: trip.tags || [],
            coverImage: trip.coverImage,
            isPublic: true,
            creator: trip.userId ? {
                _id: (trip.userId as any)._id,
                name: (trip.userId as any).name,
                memberSince: (trip.userId as any).createdAt,
            } : null,
            createdAt: trip.createdAt,
        }));

        res.json({
            success: true,
            trips: publicTrips,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: skip + limitNum < total,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch feed' });
    }
};

// POST /api/feed/:tripId/like â€” toggle like
export const likeTrip = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tripId } = req.params;
        const userId = (req as AuthRequest).userId;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required to like trips' });
            return;
        }

        const trip = await SavedTrip.findOne({ _id: tripId, isPublic: true });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found or is not public' });
            return;
        }

        const userObjId = new mongoose.Types.ObjectId(userId);
        const alreadyLiked = trip.likedBy.some((id) => id.equals(userObjId));

        if (alreadyLiked) {
            // Unlike
            trip.likedBy = trip.likedBy.filter((id) => !id.equals(userObjId));
            trip.likes = Math.max(0, trip.likes - 1);
        } else {
            // Like
            trip.likedBy.push(userObjId);
            trip.likes += 1;
        }

        await trip.save();

        res.json({
            success: true,
            liked: !alreadyLiked,
            likes: trip.likes,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to toggle like' });
    }
};

// GET /api/feed/trending â€” aggregate most-visited cities
export const getTrendingDestinations = async (_req: Request, res: Response): Promise<void> => {
    try {
        const trending = await SavedTrip.aggregate([
            { $match: { isPublic: true } },
            { $unwind: '$tripResult.itinerary' },
            {
                $group: {
                    _id: '$tripResult.itinerary.city',
                    tripCount: { $sum: 1 },
                    totalLikes: { $sum: '$likes' },
                },
            },
            { $sort: { tripCount: -1, totalLikes: -1 } },
            { $limit: 12 },
            {
                $project: {
                    city: '$_id',
                    tripCount: 1,
                    totalLikes: 1,
                    _id: 0,
                },
            },
        ]);

        res.json({ success: true, destinations: trending });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch trending' });
    }
};

// GET /api/feed/user/:userId â€” public user profile
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('name createdAt');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const [publicTrips, reviewCount] = await Promise.all([
            SavedTrip.find({ userId, isPublic: true })
                .sort({ likes: -1 })
                .select('title tripRequest.stateCode tripRequest.duration tripRequest.budget tripResult.summary likes tags coverImage createdAt')
                .lean(),
            Review.countDocuments({ userId }),
        ]);

        res.json({
            success: true,
            profile: {
                _id: user._id,
                name: user.name,
                memberSince: user.createdAt,
                tripCount: publicTrips.length,
                reviewCount,
                totalLikes: publicTrips.reduce((sum: number, t: any) => sum + (t.likes || 0), 0),
            },
            trips: publicTrips,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
    }
};

// PUT /api/feed/:tripId/publish â€” publish/unpublish a trip
export const publishTrip = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tripId } = req.params;
        const userId = (req as AuthRequest).userId;
        const { isPublic, tags, coverImage } = req.body;

        const trip = await SavedTrip.findOne({ _id: tripId, userId });
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }

        trip.isPublic = isPublic;
        if (tags) trip.tags = tags;
        if (coverImage !== undefined) trip.coverImage = coverImage;

        await trip.save();

        res.json({
            success: true,
            message: isPublic ? 'Trip published to community!' : 'Trip unpublished',
            trip: {
                _id: trip._id,
                isPublic: trip.isPublic,
                tags: trip.tags,
                coverImage: trip.coverImage,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to publish trip' });
    }
};
