import mongoose, { Schema } from 'mongoose';

export interface IAnalytics {
    type: 'pageview' | 'search' | 'trip_generation' | 'api_call';
    endpoint: string;
    method: string;
    searchQuery?: string;
    userId?: mongoose.Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
    responseTime?: number;
    statusCode?: number;
    timestamp: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>({
    type: {
        type: String,
        enum: ['pageview', 'search', 'trip_generation', 'api_call'],
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true,
        index: true
    },
    method: {
        type: String,
        required: true
    },
    searchQuery: {
        type: String,
        sparse: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    responseTime: {
        type: Number
    },
    statusCode: {
        type: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for efficient time-based queries
AnalyticsSchema.index({ timestamp: -1, type: 1 });

const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);

export default Analytics;
