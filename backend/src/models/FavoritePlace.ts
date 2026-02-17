import mongoose, { Schema, Document } from 'mongoose';

export interface IFavoritePlace extends Document {
    userId: mongoose.Types.ObjectId;
    placeId: string;
    placeName: string;
    cityName: string;
    addedAt: Date;
}

const FavoritePlaceSchema: Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    placeId: {
        type: String,
        required: true,
    },
    placeName: {
        type: String,
        required: true,
        trim: true,
    },
    cityName: {
        type: String,
        required: true,
        trim: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound unique index — one favorite per user per place
FavoritePlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export default mongoose.model<IFavoritePlace>('FavoritePlace', FavoritePlaceSchema);
