import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    userId: mongoose.Types.ObjectId;
    userName: string;
    placeId: string;
    placeName: string;
    cityName: string;
    rating: number;
    title: string;
    comment: string;
    visitDate?: Date;
    photos?: string[];
    helpfulCount: number;
    helpfulBy: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        userName: {
            type: String,
            required: true,
            trim: true,
        },
        placeId: {
            type: String,
            required: [true, 'Place ID is required'],
        },
        placeName: {
            type: String,
            required: true,
            trim: true,
        },
        cityName: {
            type: String,
            trim: true,
            default: '',
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
            default: '',
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
            default: '',
        },
        visitDate: {
            type: Date,
        },
        photos: [{ type: String }],
        helpfulCount: {
            type: Number,
            default: 0,
        },
        helpfulBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    {
        timestamps: true,
    }
);

// Compound unique index: one review per user per place
ReviewSchema.index({ userId: 1, placeId: 1 }, { unique: true });
// Fast lookup by place
ReviewSchema.index({ placeId: 1 });
// Sort by rating
ReviewSchema.index({ rating: -1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
