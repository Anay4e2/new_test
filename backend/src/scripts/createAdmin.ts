import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/trip_planner';
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const configuredEmail = process.env.ADMIN_EMAIL?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const email = configuredEmail && emailRegex.test(configuredEmail)
            ? configuredEmail
            : 'admin@example.com';

        if (configuredEmail && !emailRegex.test(configuredEmail)) {
            console.warn(`Invalid ADMIN_EMAIL "${configuredEmail}". Falling back to ${email}.`);
        }
        const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
        const name = process.env.ADMIN_NAME || 'Admin User';

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            existingAdmin.password = password;
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
            }
            await existingAdmin.save();
            console.log(`Updated existing user role to admin and reset password.`);
        } else {
            const admin = new User({
                name,
                email,
                password,
                role: 'admin'
            });
            await admin.save();
            console.log(`Admin user created with email: ${email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
