import mongoose, { Schema, Document } from 'mongoose';

export interface ISharedTrip extends Document {
    shareId: string;
    tripRequest: any;
    tripResult: any;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    expiresAt: Date;
    viewCount: number;
}

const SharedTripSchema: Schema = new Schema({
    shareId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    tripRequest: {
        type: Schema.Types.Mixed,
        required: true,
    },
    tripResult: {
        type: Schema.Types.Mixed,
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    viewCount: {
        type: Number,
        default: 0,
    },
});

// TTL index — MongoDB auto-deletes docs when expiresAt is reached
SharedTripSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<ISharedTrip>('SharedTrip', SharedTripSchema);
