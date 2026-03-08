import { Router } from 'express';
import multer from 'multer';
import { adminMiddleware } from '../middleware/adminMiddleware';
import {
    getSummary,
    getTraffic,
    getSearches,
    getRecentActivity
} from '../controllers/analyticsController';
import {
    getAllPlacesAdmin,
    createPlace,
    updatePlace,
    deletePlace,
    getAllTripsAdmin,
    deleteTripAdmin,
    updateTripAdmin,
    getAllUsersAdmin,
    updateUserRole,
    deleteUserAdmin,
    getAllHotelsAdmin,
    createHotelAdmin,
    updateHotelAdmin,
    deleteHotelAdmin,
    getAllRestaurantsAdmin,
    createRestaurantAdmin,
    updateRestaurantAdmin,
    deleteRestaurantAdmin,
    getAllFestivalsAdmin,
    createFestivalAdmin,
    updateFestivalAdmin,
    deleteFestivalAdmin,
    bulkDeletePlaces,
    bulkDeleteHotels,
    bulkDeleteRestaurants,
    bulkDeleteFestivals,
    getAuditLogs,
    getActiveSessions,
    uploadImage,
    uploadFile,
    getAppSettings,
    updateAppSettings
} from '../controllers/adminController';

const router = Router();

// Multer for multipart file uploads (images, videos, PDFs) — 50MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
});

// All routes require admin authentication
router.use(adminMiddleware);

// Analytics endpoints
router.get('/analytics/summary', getSummary);
router.get('/analytics/traffic', getTraffic);
router.get('/analytics/searches', getSearches);
router.get('/analytics/recent', getRecentActivity);

// Places Management
router.get('/places', getAllPlacesAdmin);
router.post('/places', createPlace);
router.put('/places/:id', updatePlace);
router.delete('/places/:id', deletePlace);
router.post('/places/bulk-delete', bulkDeletePlaces);

// Trips Management
router.get('/trips', getAllTripsAdmin);
router.put('/trips/:id', updateTripAdmin);
router.delete('/trips/:id', deleteTripAdmin);

// Users Management
router.get('/users', getAllUsersAdmin);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUserAdmin);

// Hotels Management
router.get('/hotels', getAllHotelsAdmin);
router.post('/hotels', createHotelAdmin);
router.put('/hotels/:id', updateHotelAdmin);
router.delete('/hotels/:id', deleteHotelAdmin);
router.post('/hotels/bulk-delete', bulkDeleteHotels);

// Restaurants Management
router.get('/restaurants', getAllRestaurantsAdmin);
router.post('/restaurants', createRestaurantAdmin);
router.put('/restaurants/:id', updateRestaurantAdmin);
router.delete('/restaurants/:id', deleteRestaurantAdmin);
router.post('/restaurants/bulk-delete', bulkDeleteRestaurants);

// Festivals Management
router.get('/festivals', getAllFestivalsAdmin);
router.post('/festivals', createFestivalAdmin);
router.put('/festivals/:id', updateFestivalAdmin);
router.delete('/festivals/:id', deleteFestivalAdmin);
router.post('/festivals/bulk-delete', bulkDeleteFestivals);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

// Sessions
router.get('/sessions', getActiveSessions);

// Image Upload (base64 legacy)
router.post('/upload-image', uploadImage);

// Generic File Upload (multipart — images, videos, PDFs)
router.post('/upload-file', upload.single('file'), uploadFile);

// App Settings
router.get('/settings', getAppSettings);
router.put('/settings', updateAppSettings);

export default router;
