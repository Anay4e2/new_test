import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import { generateTrip, TripRequest } from './lib/planner';
import { STATES, CITIES, PACKAGES } from './lib/mockData';
import State from './models/State';
import Package from './models/Package';
import City from './models/City';
import Place from './models/Place';
import Route from './models/Route';

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
    const places = await Place.find();
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
