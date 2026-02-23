import mongoose, { Schema, Document } from 'mongoose';

export interface ICity extends Document {
  name: string;
  stateCode: string;
  coordinates: { lat: number; lng: number };
  tier: 'tier1' | 'tier2' | 'tier3';
  description: string;
  idealDays: number;
  imageUrl: string;
}

const CitySchema: Schema = new Schema({
  name: { type: String, required: true },
  stateCode: { type: String, required: true, ref: 'State' },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  tier: { type: String, enum: ['tier1', 'tier2', 'tier3'], default: 'tier2' },
  description: { type: String },
  idealDays: { type: Number, default: 2 },
  imageUrl: { type: String }
});

export default mongoose.models.City || mongoose.model<ICity>('City', CitySchema);
