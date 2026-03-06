import mongoose from 'mongoose';

/** Returns true when Mongoose has an active connection to MongoDB. */
export function isDbConnected(): boolean {
    return mongoose.connection.readyState === 1;
}
