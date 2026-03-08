import logger from '../lib/logger';
import { Request, Response } from 'express';
import Package from '../models/Package';
import Place from '../models/Place';

// Get all active packages (public)
export const getPackages = async (req: Request, res: Response): Promise<void> => {
    try {
        const packages = await Package.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: packages });
    } catch (error) {
        logger.error('Error fetching packages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch packages' });
    }
};

// Get package by ID with populated places (public)
export const getPackageById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const pkg = await Package.findOne({ id, isActive: true });

        if (!pkg) {
            res.status(404).json({ success: false, message: 'Package not found' });
            return;
        }

        // Fetch places: by explicit IDs if set, otherwise by city names
        let places;
        if (pkg.places && pkg.places.length > 0) {
            places = await Place.find({ _id: { $in: pkg.places } });
        } else if (pkg.cities && pkg.cities.length > 0) {
            places = await Place.find({ cityName: { $in: pkg.cities } });
        } else {
            places = [];
        }

        res.json({
            success: true,
            data: {
                ...pkg.toObject(),
                placesDetails: places
            }
        });
    } catch (error) {
        logger.error('Error fetching package:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch package' });
    }
};

// Get all packages for admin (including inactive)
export const getAllPackagesAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.json({ success: true, data: packages });
    } catch (error) {
        logger.error('Error fetching packages:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch packages' });
    }
};

// Create package (admin only)
export const createPackage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id, title, state, days, price, image, description, tags, places, cities } = req.body;

        // Check if package with same ID exists
        const existing = await Package.findOne({ id });
        if (existing) {
            res.status(400).json({ success: false, message: 'Package with this ID already exists' });
            return;
        }

        const newPackage = new Package({
            id,
            title,
            state,
            days,
            price,
            image,
            description,
            tags: tags || [],
            places: places || [],
            cities: cities || [],
            isActive: true
        });

        await newPackage.save();
        res.status(201).json({ success: true, data: newPackage });
    } catch (error) {
        logger.error('Error creating package:', error);
        res.status(500).json({ success: false, message: 'Failed to create package' });
    }
};

// Update package (admin only)
export const updatePackage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const pkg = await Package.findOneAndUpdate(
            { id },
            { $set: updates },
            { new: true }
        );

        if (!pkg) {
            res.status(404).json({ success: false, message: 'Package not found' });
            return;
        }

        res.json({ success: true, data: pkg });
    } catch (error) {
        logger.error('Error updating package:', error);
        res.status(500).json({ success: false, message: 'Failed to update package' });
    }
};

// Delete package (admin only)
export const deletePackage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const pkg = await Package.findOneAndDelete({ id });

        if (!pkg) {
            res.status(404).json({ success: false, message: 'Package not found' });
            return;
        }

        res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
        logger.error('Error deleting package:', error);
        res.status(500).json({ success: false, message: 'Failed to delete package' });
    }
};
