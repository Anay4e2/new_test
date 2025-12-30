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
}

const PackageSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  state: { type: String, required: true },
  days: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  description: { type: String },
  tags: [{ type: String }]
});

export default mongoose.model<IPackage>('Package', PackageSchema);
