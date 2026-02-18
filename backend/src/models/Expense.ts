import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    userId: mongoose.Types.ObjectId;
    tripId: mongoose.Types.ObjectId;
    category: 'stay' | 'transport' | 'food' | 'activities' | 'shopping' | 'tips' | 'other';
    amount: number;
    description: string;
    day: number;
    city?: string;
    paymentMethod: 'cash' | 'upi' | 'card' | 'other';
    receipt?: string;
    createdAt: Date;
}

const ExpenseSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        tripId: {
            type: Schema.Types.ObjectId,
            ref: 'SavedTrip',
            required: true,
        },
        category: {
            type: String,
            enum: ['stay', 'transport', 'food', 'activities', 'shopping', 'tips', 'other'],
            required: [true, 'Category is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        day: {
            type: Number,
            required: [true, 'Day number is required'],
            min: [1, 'Day must be at least 1'],
        },
        city: {
            type: String,
            trim: true,
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'upi', 'card', 'other'],
            default: 'cash',
        },
        receipt: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
ExpenseSchema.index({ userId: 1, tripId: 1 });
ExpenseSchema.index({ tripId: 1, day: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
