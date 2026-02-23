import mongoose, { Schema, Document } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  cityName: string;
  type: string; // Fort, Palace, etc.
  coordinates: { lat: number; lng: number };
  description?: string;
  visitDuration?: string;
  entryFee?: string;
  bestTime?: string;
  timeRequired: number; // hours
  openingTime: string;
  closingTime: string;
  bestTimeOfDay: string;
  rating: number;
  reviewCount: number;
  averageRating: number;
  tags: string[];
  priceTier: 'free' | 'low' | 'medium' | 'high';
  imageUrl?: string;
  images?: string[];
  thumbnailUrl?: string;
}

const PlaceSchema: Schema = new Schema({
  name: { type: String, required: true },
  cityName: { type: String, required: true, ref: 'City' },
  type: { type: String },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  description: { type: String },
  visitDuration: { type: String }, // e.g. "1 hr", formatted string
  entryFee: { type: String },
  bestTime: { type: String },
  timeRequired: { type: Number, default: 1 },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '17:00' },
  bestTimeOfDay: { type: String, default: 'day' },
  rating: { type: Number, default: 4.0 },
  reviewCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  tags: [{ type: String }],
  priceTier: { type: String, enum: ['free', 'low', 'medium', 'high'], default: 'medium' },
  imageUrl: { type: String },
  images: [{ type: String }],
  thumbnailUrl: { type: String }
});

export default mongoose.models.Place || mongoose.model<IPlace>('Place', PlaceSchema);
