import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../lib/logger';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/trip_planner';
    const safeUri = mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    logger.info(`Connecting to MongoDB at ${safeUri}...`);
    await mongoose.connect(mongoURI);
    logger.info('MongoDB Connected');
  } catch (err) {
    logger.error('MongoDB Connection Error:', err);
  }
};

export default connectDB;
