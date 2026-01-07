import { Router } from 'express';
import {
    getTrainsBetweenStations,
    getStationCodes,
    getLiveStation,
    getTrainSchedule,
    getTrainStatus,
    checkPNRStatus,
    searchStation,
    checkSeatAvailability,
    getFare
} from '../controllers/trainController';

const router = Router();

// Station search and codes
router.get('/stations', getStationCodes);
router.get('/search/station', searchStation);

// PNR Status
router.get('/pnr/:pnrNumber', checkPNRStatus);

// Train between stations
router.get('/:fromCity/:toCity', getTrainsBetweenStations);

// Live station
router.get('/station/:stationCode/live', getLiveStation);

// Train specific routes
router.get('/:trainNumber/schedule', getTrainSchedule);
router.get('/:trainNumber/status', getTrainStatus);
router.get('/:trainNumber/availability', checkSeatAvailability);
router.get('/:trainNumber/fare', getFare);

export default router;
