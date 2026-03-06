import logger from '../lib/logger';
import { Request, Response } from 'express';
import Place from '../models/Place';
import SavedTrip from '../models/SavedTrip';
import User from '../models/User';

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        res.json({ success: true, message: 'Trip deleted successfully' });
    } catch (error) {
        logger.error('Error in deleteTripAdmin:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
