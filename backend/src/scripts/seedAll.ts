/**
 * Comprehensive Seed Script — sends ALL mock data to the connected MongoDB.
 * Run: npx ts-node src/scripts/seedAll.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import State from '../models/State';
import City from '../models/City';
import Place from '../models/Place';
import Package from '../models/Package';
import Hotel from '../models/Hotel';
import Restaurant from '../models/Restaurant';
import Festival from '../models/Festival';
import Route from '../models/Route';

import {
    STATES,
    CITIES,
    PLACES,
    PACKAGES,
    HOTELS,
    RESTAURANTS,
    FESTIVALS,
} from '../services/mockData';

// Routes data from seedDatabase.ts (not in mockData)
import { ROUTES_DATA } from './routesData';

async function seedAll() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/trip_planner';
    const safeUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`Connecting to ${safeUri} ...`);
    await mongoose.connect(uri);
    console.log('Connected!\n');

    // ---------- States ----------
    console.log('Seeding States...');
    await State.deleteMany({});
    const states = await State.insertMany(
        STATES.map((s: any) => {
            const { _id, ...rest } = s;
            return { ...rest, code: rest.code || _id };
        })
    );
    console.log(`  ✓ ${states.length} states`);

    // ---------- Cities ----------
    console.log('Seeding Cities...');
    await City.deleteMany({});
    const cities = await City.insertMany(
        CITIES.map((c: any) => { const { _id, ...rest } = c; return rest; })
    );
    console.log(`  ✓ ${cities.length} cities`);

    // ---------- Places ----------
    console.log('Seeding Places...');
    await Place.deleteMany({});
    const places = await Place.insertMany(
        PLACES.map((p: any) => { const { _id, ...rest } = p; return rest; })
    );
    console.log(`  ✓ ${places.length} places`);

    // ---------- Packages ----------
    console.log('Seeding Packages...');
    await Package.deleteMany({});
    const packages = await Package.insertMany(
        PACKAGES.map((pkg: any) => { const { _id, ...rest } = pkg; return rest; })
    );
    console.log(`  ✓ ${packages.length} packages`);

    // ---------- Hotels ----------
    console.log('Seeding Hotels...');
    await Hotel.deleteMany({});
    const hotels = await Hotel.insertMany(
        HOTELS.map((h: any) => { const { _id, ...rest } = h; return rest; })
    );
    console.log(`  ✓ ${hotels.length} hotels`);

    // ---------- Restaurants ----------
    console.log('Seeding Restaurants...');
    await Restaurant.deleteMany({});
    const restaurants = await Restaurant.insertMany(
        RESTAURANTS.map((r: any) => { const { _id, ...rest } = r; return rest; })
    );
    console.log(`  ✓ ${restaurants.length} restaurants`);

    // ---------- Festivals ----------
    console.log('Seeding Festivals...');
    await Festival.deleteMany({});
    const festivals = await Festival.insertMany(
        FESTIVALS.map((f: any) => { const { _id, ...rest } = f; return rest; })
    );
    console.log(`  ✓ ${festivals.length} festivals`);

    // ---------- Routes ----------
    console.log('Seeding Routes...');
    await Route.deleteMany({});
    const routes = await Route.insertMany(ROUTES_DATA);
    console.log(`  ✓ ${routes.length} routes`);

    // ---------- Summary ----------
    console.log('\n═══════════════════════════');
    console.log('  SEED COMPLETE');
    console.log('═══════════════════════════');
    console.log(`  States:      ${states.length}`);
    console.log(`  Cities:      ${cities.length}`);
    console.log(`  Places:      ${places.length}`);
    console.log(`  Packages:    ${packages.length}`);
    console.log(`  Hotels:      ${hotels.length}`);
    console.log(`  Restaurants: ${restaurants.length}`);
    console.log(`  Festivals:   ${festivals.length}`);
    console.log(`  Routes:      ${routes.length}`);
    console.log('═══════════════════════════\n');

    await mongoose.connection.close();
    console.log('Connection closed.');
    process.exit(0);
}

seedAll().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
