import mongoose, { Schema, Document } from 'mongoose';

export interface IState extends Document {
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  region: string; // North, South, East, West
  center: { lat: number; lng: number };
  zoom: number;
}

const StateSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String },
  region: { type: String },
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  zoom: { type: Number, default: 7 }
});

export default mongoose.models.State || mongoose.model<IState>('State', StateSchema);
