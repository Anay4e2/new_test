import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/trip_planner';
        console.log(`Connecting to MongoDB at ${mongoUri}...`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const email = 'admin@example.com';
        const password = 'adminpassword';

        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            // Update password just in case
            existingAdmin.password = password;
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
            }
            await existingAdmin.save();
            console.log(`Updated existing user role to admin and reset password to: ${password}`);
        } else {
            const admin = new User({
                name: 'Admin User',
                email,
                password,
                role: 'admin'
            });
            await admin.save();
            console.log(`Admin user created with email: ${email} and password: ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
