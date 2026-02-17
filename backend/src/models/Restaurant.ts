import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
    name: string;
    cityName: string;
    cuisine: string[];
    type: 'street-food' | 'casual' | 'fine-dining' | 'dhaba' | 'cafe';
    priceRange: 'budget' | 'moderate' | 'expensive';
    averageCost: number;
    rating: number;
    mustTry: string[];
    coordinates: { lat: number; lng: number };
    openingTime: string;
    closingTime: string;
    vegetarian: boolean;
    description: string;
}

const RestaurantSchema: Schema = new Schema({
    name: { type: String, required: true },
    cityName: { type: String, required: true },
    cuisine: [{ type: String }],
    type: { type: String, enum: ['street-food', 'casual', 'fine-dining', 'dhaba', 'cafe'], required: true },
    priceRange: { type: String, enum: ['budget', 'moderate', 'expensive'], required: true },
    averageCost: { type: Number, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    mustTry: [{ type: String }],
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    openingTime: { type: String, required: true },
    closingTime: { type: String, required: true },
    vegetarian: { type: Boolean, default: false },
    description: { type: String, required: true }
});

export default mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
