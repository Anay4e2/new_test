import mongoose, { Schema, Document } from 'mongoose';

export interface IDiamond extends Document {
  sku: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut?: string;
  polish?: string;
  symmetry?: string;
  fluorescence?: string;
  measurements?: string;
  depth?: number;
  table?: number;
  crown?: string;
  pavilion?: string;
  girdle?: string;
  culet?: string;
  grading_lab?: string;
  certificate_url?: string;
  video_url?: string;
  cost_price: number;
  margin_percentage: number;
  listing_price: number;
  is_sold_out: boolean;
  sold_price?: number;
  sold_at?: Date;
}

const DiamondSchema: Schema = new Schema({
  sku: { type: String, required: true, unique: true },
  shape: { type: String, required: true },
  carat: { type: Number, required: true },
  color: { type: String, required: true },
  clarity: { type: String, required: true },
  cut: { type: String },
  polish: { type: String },
  symmetry: { type: String },
  fluorescence: { type: String },
  measurements: { type: String },
  depth: { type: Number },
  table: { type: Number },
  crown: { type: String },
  pavilion: { type: String },
  girdle: { type: String },
  culet: { type: String },
  grading_lab: { type: String },
  certificate_url: { type: String },
  video_url: { type: String },
  cost_price: { type: Number, required: true },
  margin_percentage: { type: Number, default: 0 },
  listing_price: { type: Number, required: true },
  is_sold_out: { type: Boolean, default: false },
  sold_price: { type: Number },
  sold_at: { type: Date }
}, { timestamps: true });

// Pre-save hook to calculate listing price if not provided or to ensure consistency
DiamondSchema.pre('save', function(this: any, next: any) {
  if (this.isModified('cost_price') || this.isModified('margin_percentage')) {
    if (this.margin_percentage > 0) {
      this.listing_price = this.cost_price * (1 + this.margin_percentage / 100);
    }
  }
  next();
});

export default mongoose.model<IDiamond>('Diamond', DiamondSchema);
