import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'trip_reminder' | 'weather_alert' | 'price_change' | 'review_prompt' | 'festival_alert' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    isRead: boolean;
    priority: NotificationPriority;
    metadata?: Record<string, any>;
    createdAt: Date;
    expiresAt?: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['trip_reminder', 'weather_alert', 'price_change', 'review_prompt', 'festival_alert', 'system'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        actionUrl: {
            type: String,
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        expiresAt: {
            type: Date,
            index: { expireAfterSeconds: 0 }, // TTL index — auto-delete when expired
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
