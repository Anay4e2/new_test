import mongoose, { Schema, Document } from 'mongoose';

export interface IPostcard extends Document {
    userId: mongoose.Types.ObjectId;
    tripId?: mongoose.Types.ObjectId;
    imageUrl: string;
    publicId?: string;
    template: string;
    title: string;
    message: string;
    recipientEmail?: string;
    sentAt?: Date;
    createdAt: Date;
}

const PostcardSchema: Schema = new Schema(
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
        },
        imageUrl: {
            type: String,
            required: true,
        },
        publicId: String,
        template: {
            type: String,
            default: 'classic',
        },
        title: {
            type: String,
            trim: true,
            maxlength: 200,
            default: '',
        },
        message: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        recipientEmail: {
            type: String,
            trim: true,
        },
        sentAt: Date,
    },
    { timestamps: true }
);

export default mongoose.model<IPostcard>('Postcard', PostcardSchema);
