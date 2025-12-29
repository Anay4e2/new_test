import mongoose, { Schema, Document } from 'mongoose';

export interface IState extends Document {
  name: string;
  code: string;
  center: { lat: number; lng: number };
  zoom: number;
  description: string;
  imageUrl?: string;
}

const StateSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  zoom: { type: Number, default: 7 },
  description: { type: String },
  imageUrl: { type: String },
});

export default mongoose.models.State || mongoose.model<IState>('State', StateSchema);
