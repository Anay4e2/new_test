import mongoose, { Schema, Document } from 'mongoose';

export interface IHotel extends Document {
    name: string;
    cityName: string;
    stateCode: string;
    coordinates: { lat: number; lng: number };
    tier: 'budget' | 'standard' | 'premium';
    pricePerNight: number;
    rating: number;
    amenities: string[];
    imageUrl?: string;
    contactPhone?: string;
    bookingUrl?: string;
    description: string;
}

const HotelSchema: Schema = new Schema({
    name: { type: String, required: true },
    cityName: { type: String, required: true },
    stateCode: { type: String, required: true },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    tier: { type: String, enum: ['budget', 'standard', 'premium'], required: true },
    pricePerNight: { type: Number, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    amenities: [{ type: String }],
    imageUrl: { type: String },
    contactPhone: { type: String },
    bookingUrl: { type: String },
    description: { type: String, required: true }
});

export default mongoose.model<IHotel>('Hotel', HotelSchema);
