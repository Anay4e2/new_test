import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalEntry extends Document {
    userId: mongoose.Types.ObjectId;
    tripId: mongoose.Types.ObjectId;
    day: number;
    city: string;
    title: string;
    content: string;
    mood: 'amazing' | 'happy' | 'neutral' | 'tired' | 'challenging';
    photos: string[];
    placeName?: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const JournalEntrySchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tripId: {
            type: Schema.Types.ObjectId,
            ref: 'SavedTrip',
            required: true,
            index: true,
        },
        day: {
            type: Number,
            required: true,
            min: 1,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        content: {
            type: String,
            default: '',
            maxlength: [10000, 'Content cannot exceed 10000 characters'],
        },
        mood: {
            type: String,
            enum: ['amazing', 'happy', 'neutral', 'tired', 'challenging'],
            default: 'happy',
        },
        photos: [{
            type: String,
        }],
        placeName: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
JournalEntrySchema.index({ userId: 1, tripId: 1 });

export default mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
