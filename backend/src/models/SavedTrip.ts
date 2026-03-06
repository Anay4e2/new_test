import mongoose, { Schema, Document } from 'mongoose';

// ─── Sub-schemas for structured trip data ───

const ConstraintsSchema = new Schema({
    maxTravelHoursPerDay: { type: Number, default: 6 },
    seniorFriendly: { type: Boolean, default: false },
    morningReligious: { type: Boolean, default: false },
    noNightTravel: { type: Boolean, default: false },
}, { _id: false });

const TripRequestSchema = new Schema({
    stateCode: { type: String },
    stateCodes: [{ type: String }],
    selectedCityIds: [{ type: String }],
    duration: { type: Number },
    budget: { type: String, enum: ['budget', 'standard', 'premium'] },
    travelStyle: { type: String, enum: ['relaxed', 'fast'] },
    constraints: { type: ConstraintsSchema, default: () => ({}) },
}, { _id: false, strict: false });

const CostBreakupSchema = new Schema({
    stay: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
}, { _id: false });

const SummarySchema = new Schema({
    totalCost: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 },
    feasibility: { type: String, enum: ['comfortable', 'tight', 'not recommended'], default: 'comfortable' },
    costBreakup: { type: CostBreakupSchema, default: () => ({}) },
}, { _id: false });

const DayStatsSchema = new Schema({
    totalDistance: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    feasibility: { type: String, enum: ['comfortable', 'tight', 'impossible'], default: 'comfortable' },
}, { _id: false });

const DayItinerarySchema = new Schema({
    day: { type: Number },
    date: { type: String },
    city: { type: String },
    activities: [{ type: Schema.Types.Mixed }],
    travel: { type: Schema.Types.Mixed },
    nightStay: { type: Schema.Types.Mixed },
    meals: { type: Schema.Types.Mixed },
    weather: { type: Schema.Types.Mixed },
    festival: { type: Schema.Types.Mixed },
    stats: { type: DayStatsSchema, default: () => ({}) },
}, { _id: false, strict: false });

const TripResultSchema = new Schema({
    itinerary: [{ type: DayItinerarySchema }],
    warnings: [{ type: String }],
    summary: { type: SummarySchema, default: () => ({}) },
}, { _id: false, strict: false });

// ─── Main document interface ───

export interface ISavedTrip extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    tripRequest: Record<string, any>;
    tripResult: Record<string, any>;
    isFavorite: boolean;
    notes?: string;
    isPublic: boolean;
    likes: number;
    likedBy: mongoose.Types.ObjectId[];
    tags: string[];
    coverImage?: string;
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
            type: TripRequestSchema,
            required: true,
        },
        tripResult: {
            type: TripResultSchema,
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
        isPublic: {
            type: Boolean,
            default: false,
            index: true,
        },
        likes: {
            type: Number,
            default: 0,
        },
        likedBy: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        tags: [{
            type: String,
            trim: true,
        }],
        coverImage: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Composite index for efficient user trip queries
SavedTripSchema.index({ userId: 1, createdAt: -1 });
// Index for public feed queries
SavedTripSchema.index({ isPublic: 1, likes: -1 });

export default mongoose.model<ISavedTrip>('SavedTrip', SavedTripSchema);
