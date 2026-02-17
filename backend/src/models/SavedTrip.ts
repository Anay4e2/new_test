import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedTrip extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    tripRequest: any;
    tripResult: any;
    isFavorite: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SavedTripSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Trip title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        tripRequest: {
            type: Schema.Types.Mixed,
            required: true,
        },
        tripResult: {
            type: Schema.Types.Mixed,
            required: true,
        },
        isFavorite: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ISavedTrip>('SavedTrip', SavedTripSchema);
