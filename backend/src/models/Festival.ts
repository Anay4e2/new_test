import mongoose, { Schema, Document } from 'mongoose';

export interface IFestival extends Document {
    name: string;
    cityName: string;
    stateCode: string;
    month: number;
    approximateDate?: string;
    duration: number;
    type: 'religious' | 'cultural' | 'fair' | 'music' | 'food' | 'art';
    description: string;
    highlights: string[];
    impact: 'must-see' | 'worth-attending' | 'background';
    crowdLevel: 'extreme' | 'high' | 'moderate' | 'low';
    travelAdvisory?: string;
    imageUrl?: string;
}

const FestivalSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        cityName: { type: String, required: true, trim: true },
        stateCode: { type: String, required: true, trim: true },
        month: { type: Number, required: true, min: 1, max: 12 },
        approximateDate: { type: String, trim: true },
        duration: { type: Number, required: true, min: 1 },
        type: {
            type: String,
            required: true,
            enum: ['religious', 'cultural', 'fair', 'music', 'food', 'art'],
        },
        description: { type: String, required: true },
        highlights: [{ type: String }],
        impact: {
            type: String,
            required: true,
            enum: ['must-see', 'worth-attending', 'background'],
        },
        crowdLevel: {
            type: String,
            required: true,
            enum: ['extreme', 'high', 'moderate', 'low'],
        },
        travelAdvisory: { type: String, trim: true },
        imageUrl: { type: String, trim: true },
    },
    { timestamps: true }
);

FestivalSchema.index({ stateCode: 1 });
FestivalSchema.index({ month: 1 });
FestivalSchema.index({ cityName: 1 });

export default mongoose.model<IFestival>('Festival', FestivalSchema);
