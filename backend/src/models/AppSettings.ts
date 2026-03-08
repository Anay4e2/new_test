import mongoose, { Schema } from 'mongoose';

export interface IAppSettings {
    siteName: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxTripsPerUser: number;
    featuredPackageIds: string[];
    defaultCurrency: string;
    contactEmail: string;
    socialLinks: {
        twitter?: string;
        instagram?: string;
        facebook?: string;
    };
    updatedAt: Date;
}

const AppSettingsSchema = new Schema<IAppSettings>({
    siteName: { type: String, default: 'TripPlanner India' },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    maxTripsPerUser: { type: Number, default: 50 },
    featuredPackageIds: [{ type: String }],
    defaultCurrency: { type: String, default: 'INR' },
    contactEmail: { type: String, default: '' },
    socialLinks: {
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' }
    },
    updatedAt: { type: Date, default: Date.now }
});

AppSettingsSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export default mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);
