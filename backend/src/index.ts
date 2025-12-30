import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { TripRequest, generateTrip } from './lib/planner';
import { STATES, CITIES, PACKAGES } from './lib/mockData';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock DB connection (replace with real one if needed)
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trip-planner');

app.get('/api/config', (req, res) => {
  res.json({
    states: STATES,
    cities: CITIES,
    packages: PACKAGES
  });
});

app.post('/api/generate-trip', async (req, res) => {
  try {
    const tripRequest: TripRequest = req.body;

    // Validate request
    if (!tripRequest.selectedCityIds || tripRequest.selectedCityIds.length === 0) {
      res.status(400).json({ error: 'Please select at least one city' });
      return;
    }

    const result = generateTrip(tripRequest);
    res.json(result);
  } catch (error: any) {
    console.error('Error generating trip:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
