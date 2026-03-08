import logger from '../lib/logger';
import { Request, Response } from 'express';
import Place from '../models/Place';
import SavedTrip from '../models/SavedTrip';
import User from '../models/User';
import Hotel from '../models/Hotel';
import Restaurant from '../models/Restaurant';
import Festival from '../models/Festival';
import AuditLog from '../models/AuditLog';
import { AdminRequest } from '../middleware/adminMiddleware';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to create audit log
async function audit(adminId: string, action: string, entity: string, entityId: string, details?: Record<string, any>) {
    try {
        await AuditLog.create({ adminId, action, entity, entityId, details, timestamp: new Date() });
    } catch (e) {
        logger.error('Audit log failed:', e);
    }
}

// --- Places Management ---

export const getAllPlacesAdmin = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const type = req.query.type as string;

        const query: any = {};
        if (search) {
            const escaped = escapeRegex(search);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { cityName: { $regex: escaped, $options: 'i' } }
            ];
        }
        if (type && type !== 'all') {
            query.type = type;
        }

        const total = await Place.countDocuments(query);
        const places = await Place.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            places,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error in getAllPlacesAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const createPlace = async (req: Request, res: Response) => {
    try {
        const newPlace = new Place(req.body);
        await newPlace.save();
        await audit((req as AdminRequest).userId || '', 'create', 'place', newPlace._id.toString());
        res.status(201).json({ success: true, place: newPlace });
    } catch (error) {
        logger.error('Error in createPlace:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updatePlace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedPlace = await Place.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedPlace) {
            return res.status(404).json({ success: false, message: 'Place not found' });
        }
        await audit((req as AdminRequest).userId || '', 'update', 'place', id);
        res.json({ success: true, place: updatedPlace });
    } catch (error) {
        logger.error('Error in updatePlace:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deletePlace = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Place.findByIdAndDelete(id);
        await audit((req as AdminRequest).userId || '', 'delete', 'place', id);
        res.json({ success: true, message: 'Place deleted successfully' });
    } catch (error) {
        logger.error('Error in deletePlace:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Trips Management ---

export const getAllTripsAdmin = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const query: any = {};
        if (search) {
            query.title = { $regex: escapeRegex(search), $options: 'i' };
        }

        const total = await SavedTrip.countDocuments(query);
        const trips = await SavedTrip.find(query)
            .populate('userId', 'name email') // Populate user details
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            trips,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Error in getAllTripsAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteTripAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await SavedTrip.findByIdAndDelete(id);
        await audit((req as AdminRequest).userId || '', 'delete', 'trip', id);
        res.json({ success: true, message: 'Trip deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteTripAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Update Trip (toggle visibility) ---

export const updateTripAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedTrip = await SavedTrip.findByIdAndUpdate(id, req.body, { new: true }).populate('userId', 'name email');
        if (!updatedTrip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }
        await audit((req as AdminRequest).userId || '', 'update', 'trip', id, req.body);
        res.json({ success: true, trip: updatedTrip });
    } catch (error) {
        logger.error('Error in updateTripAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- User Management ---

export const getAllUsersAdmin = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const role = req.query.role as string;

        const query: any = {};
        if (search) {
            const escaped = escapeRegex(search);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } }
            ];
        }
        if (role && role !== 'all') {
            query.role = role;
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('name email role provider createdAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            success: true,
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        logger.error('Error in getAllUsersAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('name email role createdAt');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        await audit((req as AdminRequest).userId || '', 'update_role', 'user', id, { role });
        res.json({ success: true, user });
    } catch (error) {
        logger.error('Error in updateUserRole:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteUserAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Don't allow deleting yourself
        if (id === (req as AdminRequest).userId) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        await User.findByIdAndDelete(id);
        await audit((req as AdminRequest).userId || '', 'delete', 'user', id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteUserAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Hotels Management ---

export const getAllHotelsAdmin = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const tier = req.query.tier as string;

        const query: any = {};
        if (search) {
            const escaped = escapeRegex(search);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { cityName: { $regex: escaped, $options: 'i' } }
            ];
        }
        if (tier && tier !== 'all') query.tier = tier;

        const total = await Hotel.countDocuments(query);
        const hotels = await Hotel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

        res.json({ success: true, hotels, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        logger.error('Error in getAllHotelsAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const createHotelAdmin = async (req: Request, res: Response) => {
    try {
        const hotel = new Hotel(req.body);
        await hotel.save();
        await audit((req as AdminRequest).userId || '', 'create', 'hotel', hotel._id.toString());
        res.status(201).json({ success: true, hotel });
    } catch (error) {
        logger.error('Error in createHotelAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateHotelAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const hotel = await Hotel.findByIdAndUpdate(id, req.body, { new: true });
        if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
        await audit((req as AdminRequest).userId || '', 'update', 'hotel', id);
        res.json({ success: true, hotel });
    } catch (error) {
        logger.error('Error in updateHotelAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteHotelAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Hotel.findByIdAndDelete(id);
        await audit((req as AdminRequest).userId || '', 'delete', 'hotel', id);
        res.json({ success: true, message: 'Hotel deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteHotelAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Restaurants Management ---

export const getAllRestaurantsAdmin = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const type = req.query.type as string;

        const query: any = {};
        if (search) {
            const escaped = escapeRegex(search);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { cityName: { $regex: escaped, $options: 'i' } }
            ];
        }
        if (type && type !== 'all') query.type = type;

        const total = await Restaurant.countDocuments(query);
        const restaurants = await Restaurant.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);

        res.json({ success: true, restaurants, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        logger.error('Error in getAllRestaurantsAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const createRestaurantAdmin = async (req: Request, res: Response) => {
    try {
        const restaurant = new Restaurant(req.body);
        await restaurant.save();
        await audit((req as AdminRequest).userId || '', 'create', 'restaurant', restaurant._id.toString());
        res.status(201).json({ success: true, restaurant });
    } catch (error) {
        logger.error('Error in createRestaurantAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateRestaurantAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(id, req.body, { new: true });
        if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
        await audit((req as AdminRequest).userId || '', 'update', 'restaurant', id);
        res.json({ success: true, restaurant });
    } catch (error) {
        logger.error('Error in updateRestaurantAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteRestaurantAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Restaurant.findByIdAndDelete(id);
        await audit((req as AdminRequest).userId || '', 'delete', 'restaurant', id);
        res.json({ success: true, message: 'Restaurant deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteRestaurantAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Festivals Management ---

export const getAllFestivalsAdmin = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const type = req.query.type as string;

        const query: any = {};
        if (search) {
            const escaped = escapeRegex(search);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { cityName: { $regex: escaped, $options: 'i' } }
            ];
        }
        if (type && type !== 'all') query.type = type;

        const total = await Festival.countDocuments(query);
        const festivals = await Festival.find(query).sort({ month: 1 }).skip((page - 1) * limit).limit(limit);

        res.json({ success: true, festivals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        logger.error('Error in getAllFestivalsAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const createFestivalAdmin = async (req: Request, res: Response) => {
    try {
        const festival = new Festival(req.body);
        await festival.save();
        await audit((req as AdminRequest).userId || '', 'create', 'festival', festival._id.toString());
        res.status(201).json({ success: true, festival });
    } catch (error) {
        logger.error('Error in createFestivalAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateFestivalAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const festival = await Festival.findByIdAndUpdate(id, req.body, { new: true });
        if (!festival) return res.status(404).json({ success: false, message: 'Festival not found' });
        await audit((req as AdminRequest).userId || '', 'update', 'festival', id);
        res.json({ success: true, festival });
    } catch (error) {
        logger.error('Error in updateFestivalAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const deleteFestivalAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Festival.findByIdAndDelete(id);
        await audit((req as AdminRequest).userId || '', 'delete', 'festival', id);
        res.json({ success: true, message: 'Festival deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteFestivalAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Bulk Operations ---

export const bulkDeletePlaces = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of IDs' });
        }
        const result = await Place.deleteMany({ _id: { $in: ids } });
        await audit((req as AdminRequest).userId || '', 'bulk_delete', 'place', ids.join(','), { count: result.deletedCount });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        logger.error('Error in bulkDeletePlaces:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const bulkDeleteHotels = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of IDs' });
        }
        const result = await Hotel.deleteMany({ _id: { $in: ids } });
        await audit((req as AdminRequest).userId || '', 'bulk_delete', 'hotel', ids.join(','), { count: result.deletedCount });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        logger.error('Error in bulkDeleteHotels:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const bulkDeleteRestaurants = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of IDs' });
        }
        const result = await Restaurant.deleteMany({ _id: { $in: ids } });
        await audit((req as AdminRequest).userId || '', 'bulk_delete', 'restaurant', ids.join(','), { count: result.deletedCount });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        logger.error('Error in bulkDeleteRestaurants:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const bulkDeleteFestivals = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of IDs' });
        }
        const result = await Festival.deleteMany({ _id: { $in: ids } });
        await audit((req as AdminRequest).userId || '', 'bulk_delete', 'festival', ids.join(','), { count: result.deletedCount });
        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        logger.error('Error in bulkDeleteFestivals:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Audit Logs ---

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const entity = req.query.entity as string;

        const query: any = {};
        if (entity && entity !== 'all') query.entity = entity;

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('adminId', 'name email')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ success: true, logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        logger.error('Error in getAuditLogs:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Session Management ---

export const getActiveSessions = async (req: Request, res: Response) => {
    try {
        // Return recent unique users who have made API calls in the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const Analytics = (await import('../models/Analytics')).default;

        const sessions = await Analytics.aggregate([
            { $match: { timestamp: { $gte: oneDayAgo }, userId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$userId',
                    lastActivity: { $max: '$timestamp' },
                    requestCount: { $sum: 1 },
                    lastEndpoint: { $last: '$endpoint' },
                    lastIp: { $last: '$ipAddress' },
                    lastUserAgent: { $last: '$userAgent' }
                }
            },
            { $sort: { lastActivity: -1 } },
            { $limit: 50 }
        ]);

        // Populate user details
        const userIds = sessions.map(s => s._id);
        const users = await User.find({ _id: { $in: userIds } }).select('name email role');
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        const enriched = sessions.map(s => ({
            userId: s._id,
            user: userMap.get(s._id.toString()) || null,
            lastActivity: s.lastActivity,
            requestCount: s.requestCount,
            lastEndpoint: s.lastEndpoint,
            lastIp: s.lastIp,
            lastUserAgent: s.lastUserAgent
        }));

        res.json({ success: true, sessions: enriched });
    } catch (error) {
        logger.error('Error in getActiveSessions:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Image Upload (base64) ---

export const uploadImage = async (req: Request, res: Response) => {
    try {
        const { image, folder } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, message: 'No image data provided' });
        }

        // Validate base64 format
        const matches = image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/);
        if (!matches) {
            return res.status(400).json({ success: false, message: 'Invalid image format. Use base64 data URL.' });
        }

        // In production, you'd upload to S3/Cloudinary. For MVP, store as data URL.
        // The image is already a valid data URL that can be used in <img src="">
        const imageUrl = image;

        res.json({ success: true, imageUrl });
    } catch (error) {
        logger.error('Error in uploadImage:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- Settings / Config ---

export const getAppSettings = async (req: Request, res: Response) => {
    try {
        const AppSettings = (await import('../models/AppSettings')).default;
        let settings = await AppSettings.findOne();
        if (!settings) {
            settings = await AppSettings.create({});
        }
        res.json({ success: true, settings });
    } catch (error) {
        logger.error('Error in getAppSettings:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const updateAppSettings = async (req: Request, res: Response) => {
    try {
        const AppSettings = (await import('../models/AppSettings')).default;
        let settings = await AppSettings.findOne();
        if (!settings) {
            settings = await AppSettings.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }
        await audit((req as AdminRequest).userId || '', 'update', 'settings', 'app-settings', req.body);
        res.json({ success: true, settings });
    } catch (error) {
        logger.error('Error in updateAppSettings:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
