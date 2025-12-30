import mongoose, { Schema, Document } from 'mongoose';

export interface IRoute extends Document {
    fromCity: string;
    toCity: string;
    distance: number; // km
    roadTime: number; // hours
    type: string; // 'road', 'train', 'flight'
}

const RouteSchema: Schema = new Schema({
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    distance: { type: Number, required: true },
    roadTime: { type: Number, required: true },
    type: { type: String, default: 'road' }
});

// Create compound index for querying routes between cities
RouteSchema.index({ fromCity: 1, toCity: 1 });

export default mongoose.model<IRoute>('Route', RouteSchema);
