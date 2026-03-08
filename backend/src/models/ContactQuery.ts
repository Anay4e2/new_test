import mongoose, { Schema, Document } from 'mongoose';

export interface IContactQuery extends Document {
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'new' | 'in-progress' | 'resolved';
    adminNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const contactQuerySchema = new Schema<IContactQuery>(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
        subject: { type: String, required: true, trim: true, maxlength: 200 },
        message: { type: String, required: true, trim: true, maxlength: 2000 },
        status: { type: String, enum: ['new', 'in-progress', 'resolved'], default: 'new' },
        adminNote: { type: String, trim: true, maxlength: 500 },
    },
    { timestamps: true }
);

contactQuerySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IContactQuery>('ContactQuery', contactQuerySchema);
