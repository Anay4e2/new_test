import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  cityId: mongoose.Types.ObjectId | string; // Reference to City
  cityName: string; // Denormalized for easier mocking
  type: string; // Fort, Palace, Lake, Temple, Market, Museum, etc.
  coordinates: { lat: number; lng: number };
  timeRequired: number; // in hours
  openingTime: string; // HH:mm
  closingTime: string; // HH:mm
  bestTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  rating: number; // 1-5
  tags: string[]; // senior-friendly, religious, nature, history
  priceTier: 'free' | 'low' | 'medium' | 'high';
  imageUrl?: string;
}

const PlaceSchema: Schema = new Schema({
  name: { type: String, required: true },
  cityId: { type: Schema.Types.ObjectId, ref: 'City' },
  cityName: { type: String, required: true },
  type: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  timeRequired: { type: Number, default: 1.5 },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '17:00' },
  bestTimeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening', 'any'], default: 'any' },
  rating: { type: Number, default: 4.5 },
  tags: [String],
  priceTier: { type: String, enum: ['free', 'low', 'medium', 'high'], default: 'medium' },
  imageUrl: { type: String },
});

export default mongoose.models.Place || mongoose.model<IPlace>('Place', PlaceSchema);
