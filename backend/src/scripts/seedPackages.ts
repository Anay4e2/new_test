/**
 * Quick script to re-seed only Packages from mockData.
 * Run: npx ts-node src/scripts/seedPackages.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Package from '../models/Package';
import { PACKAGES } from '../services/mockData';

async function main() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
    if (!uri) { console.error('No MONGODB_URI found in .env'); process.exit(1); }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    await Package.deleteMany({});
    const pkgs = await Package.insertMany(
        PACKAGES.map((pkg: any) => { const { _id, ...rest } = pkg; return rest; })
    );
    console.log(`Seeded ${pkgs.length} packages`);
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
