import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistItem {
  label: string;
  checked: boolean;
  category: 'documents' | 'essentials' | 'clothing' | 'toiletries' | 'electronics' | 'other';
}

export interface ITravelChecklist extends Document {
  userId: mongoose.Types.ObjectId;
  tripId?: mongoose.Types.ObjectId;
  title: string;
  items: IChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>({
  label: { type: String, required: true, maxlength: 200 },
  checked: { type: Boolean, default: false },
  category: {
    type: String,
    enum: ['documents', 'essentials', 'clothing', 'toiletries', 'electronics', 'other'],
    default: 'other',
  },
});

const TravelChecklistSchema = new Schema<ITravelChecklist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'SavedTrip' },
    title: { type: String, required: true, maxlength: 100 },
    items: [ChecklistItemSchema],
  },
  { timestamps: true }
);

TravelChecklistSchema.index({ userId: 1, tripId: 1 });

export default mongoose.model<ITravelChecklist>('TravelChecklist', TravelChecklistSchema);
