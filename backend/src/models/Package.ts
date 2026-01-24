import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  id: string; // custom id for URL friendlyness
  title: string;
  state: string;
  days: number;
  price: number;
  image: string;
  description: string;
  tags: string[];
  places: string[]; // Array of Place IDs included in package
  cities: string[]; // Array of city names included
  isActive: boolean; // Whether package is visible to users
  createdAt: Date;
}

const PackageSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  state: { type: String, required: true },
  days: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  places: [{ type: String }],
  cities: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPackage>('Package', PackageSchema);
