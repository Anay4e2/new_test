import mongoose, { Schema, Document } from 'mongoose';

// Transport option for a route
export interface ITransportOption {
    mode: 'road' | 'train' | 'flight' | 'bus';
    duration: number; // hours
    estimatedCost: {
        min: number;
        max: number;
    };
    frequency?: string; // "Every 2 hours", "3 daily"
    bestDepartureTime?: string; // "06:00" - suggested best time
    comfort: 'budget' | 'standard' | 'premium';
    bookingUrl?: string;
}

export interface IRoute extends Document {
    fromCity: string;
    toCity: string;
    distance: number; // km
    transportOptions: ITransportOption[];
}

const TransportOptionSchema = new Schema({
    mode: {
        type: String,
        enum: ['road', 'train', 'flight', 'bus'],
        required: true
    },
    duration: { type: Number, required: true },
    estimatedCost: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    frequency: { type: String },
    bestDepartureTime: { type: String },
    comfort: {
        type: String,
        enum: ['budget', 'standard', 'premium'],
        default: 'standard'
    },
    bookingUrl: { type: String }
}, { _id: false });

const RouteSchema: Schema = new Schema({
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    distance: { type: Number, required: true },
    transportOptions: [TransportOptionSchema]
});

// Create compound index for querying routes between cities
RouteSchema.index({ fromCity: 1, toCity: 1 });

export default mongoose.model<IRoute>('Route', RouteSchema);
