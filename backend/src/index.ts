import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import { generateTrip, TripRequest } from './lib/planner';
import { optimizeRoute, getTransportOptions } from './lib/routeOptimizer';
import { STATES, CITIES, PACKAGES, PLACES } from './lib/mockData';
import State from './models/State';
import Package from './models/Package';
import City from './models/City';
import Place from './models/Place';
import Route from './models/Route';
import trainService from './lib/trainService';
import distanceService, { haversineDistance } from './lib/distanceService';
import { generateItineraryPDF } from './services/pdfService';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

app.get('/api/config', async (req, res) => {
  try {
    // Try to fetch from DB
    const dbStates = await State.find();
    const dbPackages = await Package.find();
    const dbCities = await City.find();

    if (dbStates.length > 0) {
      res.json({
        states: dbStates,
        packages: dbPackages,
        cities: dbCities
      });
    } else {
      console.log('DB empty, serving mock data');
      res.json({
        states: STATES,
        cities: CITIES,
        packages: PACKAGES
      });
    }
  } catch (error) {
    console.error('Error fetching config, falling back to mock:', error);
    res.json({
      states: STATES,
      cities: CITIES,
      packages: PACKAGES
    });
  }
});

// Get all places with coordinates for map display
app.get('/api/places', async (req, res) => {
  try {
    let places = await Place.find();

    // If no places in DB, use mock data
    if (!places || places.length === 0) {
      console.log('No places in DB, using mock data');
      res.json(PLACES);
      return;
    }

    res.json(places);
  } catch (error) {
    console.error('Error fetching places, using mock data:', error);
    res.json(PLACES);
  }
});

// Get all cities with coordinates
app.get('/api/cities', async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get all states
app.get('/api/states', async (req, res) => {
  try {
    const states = await State.find();
    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});


// Get all routes (intercity travel)
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// ============ TRAIN API ENDPOINTS (RapidAPI IRCTC) ============

// Get trains between two stations
// Example: GET /api/trains/Delhi/Mumbai?date=2026-01-15
app.get('/api/trains/:fromCity/:toCity', async (req, res) => {
  try {
    const { fromCity, toCity } = req.params;
    const { date } = req.query;

    const result = await trainService.getTrainsBetweenStations(
      fromCity,
      toCity,
      date as string | undefined
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching trains:', error);
    res.status(500).json({ error: 'Failed to fetch train information' });
  }
});

// Get available station codes
app.get('/api/trains/stations', (req, res) => {
  res.json(trainService.getStationCodes());
});

// Get live trains at a station
// Example: GET /api/trains/station/NDLS/live?hours=2
app.get('/api/trains/station/:stationCode/live', async (req, res) => {
  try {
    const { stationCode } = req.params;
    const hours = parseInt(req.query.hours as string) || 2;

    const trains = await trainService.getLiveStation(stationCode, hours);
    res.json({ stationCode, trains, totalTrains: trains.length });
  } catch (error) {
    console.error('Error fetching live station:', error);
    res.status(500).json({ error: 'Failed to fetch live station data' });
  }
});

// Get train schedule
// Example: GET /api/trains/12952/schedule
app.get('/api/trains/:trainNumber/schedule', async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const schedule = await trainService.getTrainSchedule(trainNumber);
    res.json({ trainNumber, schedule });
  } catch (error) {
    console.error('Error fetching train schedule:', error);
    res.status(500).json({ error: 'Failed to fetch train schedule' });
  }
});

// Get train live running status
// Example: GET /api/trains/12952/status
app.get('/api/trains/:trainNumber/status', async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const status = await trainService.getTrainLiveStatus(trainNumber);
    res.json({ trainNumber, status });
  } catch (error) {
    console.error('Error fetching train status:', error);
    res.status(500).json({ error: 'Failed to fetch train status' });
  }
});

// Check PNR status
// Example: GET /api/trains/pnr/1234567890
app.get('/api/trains/pnr/:pnrNumber', async (req, res) => {
  try {
    const { pnrNumber } = req.params;
    const pnrStatus = await trainService.checkPNRStatus(pnrNumber);
    res.json({ pnrNumber, status: pnrStatus });
  } catch (error) {
    console.error('Error checking PNR status:', error);
    res.status(500).json({ error: 'Failed to check PNR status' });
  }
});

// Search station by name
// Example: GET /api/trains/search/station?query=Delhi
app.get('/api/trains/search/station', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      res.status(400).json({ error: 'Query parameter is required' });
      return;
    }
    const stations = await trainService.searchStation(query as string);
    res.json({ query, stations });
  } catch (error) {
    console.error('Error searching station:', error);
    res.status(500).json({ error: 'Failed to search station' });
  }
});

// Check seat availability
// Example: GET /api/trains/12952/availability?from=Delhi&to=Mumbai&class=3A&date=2026-01-15
app.get('/api/trains/:trainNumber/availability', async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const { from, to, class: classType, date, quota } = req.query;

    if (!from || !to || !classType || !date) {
      res.status(400).json({ error: 'Required: from, to, class, date' });
      return;
    }

    const availability = await trainService.checkSeatAvailability(
      trainNumber,
      from as string,
      to as string,
      classType as string,
      date as string,
      (quota as string) || 'GN'
    );

    res.json({ trainNumber, from, to, classType, date, availability });
  } catch (error) {
    console.error('Error checking seat availability:', error);
    res.status(500).json({ error: 'Failed to check seat availability' });
  }
});

// Get fare details
// Example: GET /api/trains/12952/fare?from=Delhi&to=Mumbai
app.get('/api/trains/:trainNumber/fare', async (req, res) => {
  try {
    const { trainNumber } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ error: 'Required: from, to' });
      return;
    }

    const fare = await trainService.getFare(trainNumber, from as string, to as string);
    res.json({ trainNumber, from, to, fare });
  } catch (error) {
    console.error('Error fetching fare:', error);
    res.status(500).json({ error: 'Failed to fetch fare' });
  }
});

// Get trains for a route (combines route info with live train data)
app.get('/api/routes/:fromCity/:toCity/trains', async (req, res) => {
  try {
    const { fromCity, toCity } = req.params;
    const { date } = req.query;

    // Get route info from database
    const route = await Route.findOne({
      $or: [
        { fromCity, toCity },
        { fromCity: toCity, toCity: fromCity }
      ]
    });

    // Get live train data from RapidAPI
    const trainData = await trainService.getTrainsBetweenStations(
      fromCity,
      toCity,
      date as string | undefined
    );

    res.json({
      route: route || null,
      trains: trainData.trains,
      totalTrains: trainData.totalTrains,
      lastUpdated: trainData.lastUpdated,
      source: trainData.source,
    });
  } catch (error) {
    console.error('Error fetching route trains:', error);
    res.status(500).json({ error: 'Failed to fetch train information' });
  }
});

// ============ DISTANCE API ENDPOINTS ============

// Calculate distance between two coordinates
// Example: POST /api/distance with body { from: {lat, lng}, to: {lat, lng} }
app.post('/api/distance', async (req, res) => {
  try {
    const { from, to, useApi = true } = req.body;

    if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) {
      res.status(400).json({ error: 'Required: from.lat, from.lng, to.lat, to.lng' });
      return;
    }

    const result = await distanceService.getDistance(
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
      useApi
    );

    res.json(result);
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

// Calculate distance between two cities by name
// Example: GET /api/distance/Delhi/Mumbai
app.get('/api/distance/:fromCity/:toCity', async (req, res) => {
  try {
    const { fromCity, toCity } = req.params;
    const useApi = req.query.useApi !== 'false';

    // Get city coordinates from database
    const cities = await City.find({ name: { $in: [fromCity, toCity] } });

    if (cities.length < 2) {
      res.status(404).json({ error: 'One or both cities not found' });
      return;
    }

    const from = cities.find(c => c.name === fromCity)!;
    const to = cities.find(c => c.name === toCity)!;

    const result = await distanceService.getDistance(
      from.coordinates,
      to.coordinates,
      useApi
    );

    res.json({
      fromCity: fromCity,
      toCity: toCity,
      ...result,
      drivingTime: distanceService.getDrivingTime(result.distanceUsed),
    });
  } catch (error) {
    console.error('Error calculating city distance:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

// Quick distance (Haversine only, no API call)
// Example: GET /api/distance/quick?lat1=28.6&lon1=77.2&lat2=19.0&lon2=72.8
app.get('/api/distance/quick', (req, res) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      res.status(400).json({ error: 'Required: lat1, lon1, lat2, lon2' });
      return;
    }

    const straightLine = haversineDistance(
      parseFloat(lat1 as string),
      parseFloat(lon1 as string),
      parseFloat(lat2 as string),
      parseFloat(lon2 as string)
    );

    const roadEstimate = Math.round(straightLine * 1.3);

    res.json({
      straightLineDistance: Math.round(straightLine * 10) / 10,
      roadEstimate: roadEstimate,
      unit: 'km',
      drivingTimeHours: distanceService.getDrivingTime(roadEstimate),
    });
  } catch (error) {
    console.error('Error calculating quick distance:', error);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
});

app.post('/api/generate-trip', async (req, res) => {
  try {
    const tripRequest: TripRequest = req.body;

    // Validate request
    if (!tripRequest.selectedCityIds || tripRequest.selectedCityIds.length === 0) {
      res.status(400).json({ error: 'Please select at least one city' });
      return;
    }

    // Now planner needs to be async or handle fetching data internally
    const result = await generateTrip(tripRequest);
    res.json(result);
  } catch (error: any) {
    console.error('Error generating trip:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Generate PDF itinerary
app.post('/api/itinerary/pdf', async (req, res) => {
  try {
    const tripData = req.body;

    if (!tripData || !tripData.itinerary || !tripData.summary) {
      res.status(400).json({ error: 'Invalid trip data. Required: itinerary, summary' });
      return;
    }

    const pdfBuffer = await generateItineraryPDF(tripData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=trip-itinerary-${tripData.itinerary.length}days.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
});

// NEW: Optimize route order using TSP algorithm
app.post('/api/trips/optimize-route', async (req, res) => {
  try {
    const { placeIds, startCityName } = req.body;

    if (!placeIds || placeIds.length === 0) {
      res.status(400).json({ error: 'Please provide at least one place' });
      return;
    }

    const result = await optimizeRoute({ placeIds, startCityName });
    res.json(result);
  } catch (error: any) {
    console.error('Error optimizing route:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize route' });
  }
});

// NEW: Get transport options between two cities
app.get('/api/routes/transport', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ error: 'Please provide both from and to city names' });
      return;
    }

    const result = await getTransportOptions(from as string, to as string);
    if (!result) {
      res.status(404).json({ error: 'No route found between these cities' });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching transport options:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transport options' });
  }
});

// NEW: Get places by state code (for map hover)
app.get('/api/places/by-state/:stateCode', async (req, res) => {
  try {
    const { stateCode } = req.params;

    // Get cities in this state
    const cities = await City.find({ stateCode });
    const cityNames = cities.map(c => c.name);

    // Get places in those cities
    const places = await Place.find({ cityName: { $in: cityNames } });
    res.json(places);
  } catch (error: any) {
    console.error('Error fetching places by state:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
