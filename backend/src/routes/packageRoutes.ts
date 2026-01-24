import { Router } from 'express';
import { adminMiddleware } from '../middleware/adminMiddleware';
import {
    getPackages,
    getPackageById,
    getAllPackagesAdmin,
    createPackage,
    updatePackage,
    deletePackage
} from '../controllers/packageController';

const router = Router();

// Public routes
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Admin-only routes
router.get('/admin/all', adminMiddleware, getAllPackagesAdmin);
router.post('/', adminMiddleware, createPackage);
router.put('/:id', adminMiddleware, updatePackage);
router.delete('/:id', adminMiddleware, deletePackage);

export default router;
