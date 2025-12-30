import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import State from '../models/State';
import City from '../models/City';
import Place from '../models/Place';
import Package from '../models/Package';
import connectDB from '../config/db';

dotenv.config();

// SAMPLE DATA FOR WHOLE INDIA (Fallback if files are missing)
const SAMPLE_STATES = [
    { code: 'RJ', name: 'Rajasthan', region: 'West', center: { lat: 26.5, lng: 73.8 }, imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80', description: 'The Land of Kings.' },
    { code: 'KL', name: 'Kerala', region: 'South', center: { lat: 10.8505, lng: 76.2711 }, imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80', description: "God's Own Country." },
    { code: 'WB', name: 'West Bengal', region: 'East', center: { lat: 22.9868, lng: 87.8550 }, imageUrl: 'https://images.unsplash.com/photo-1571679654681-ba31b3b43c66?auto=format&fit=crop&q=80', description: 'Cultural capital of India.' },
    { code: 'JK', name: 'Jammu & Kashmir', region: 'North', center: { lat: 33.7782, lng: 76.5762 }, imageUrl: 'https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80', description: 'Paradise on Earth.' }
];

const SAMPLE_CITIES = [
    { name: 'Jaipur', stateCode: 'RJ', coordinates: { lat: 26.9124, lng: 75.7873 }, idealDays: 3, description: 'Pink City', imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80' },
    { name: 'Kolkata', stateCode: 'WB', coordinates: { lat: 22.5726, lng: 88.3639 }, idealDays: 3, description: 'City of Joy', imageUrl: 'https://images.unsplash.com/photo-1558431382-27e30314225d?auto=format&fit=crop&q=80' },
    { name: 'Munnar', stateCode: 'KL', coordinates: { lat: 10.0889, lng: 77.0595 }, idealDays: 2, description: 'Tea Gardens', imageUrl: 'https://images.unsplash.com/photo-1596323674681-424d86b856b3?auto=format&fit=crop&q=80' },
    { name: 'Srinagar', stateCode: 'JK', coordinates: { lat: 34.0837, lng: 74.7973 }, idealDays: 4, description: 'Dal Lake & Gardens', imageUrl: 'https://images.unsplash.com/photo-1551061803-34e8574d538e?auto=format&fit=crop&q=80' }
];

const SAMPLE_PACKAGES = [
    { id: 'golden-triangle', title: 'Golden Triangle', state: 'Multiple', days: 6, price: 25000, description: 'Delhi, Agra, Jaipur tour.', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80', tags: ['Culture', 'Heritage'] },
    { id: 'kerala-bliss', title: 'Kerala Bliss', state: 'Kerala', days: 5, price: 30000, description: 'Backwaters and beaches.', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80', tags: ['Nature', 'Relaxation'] }
];

async function seedData() {
    await connectDB();

    // Check if files exist
    const files = [
        'East_India_Tourism.xlsx',
        'North_India_Tourism.xlsx',
        'South_India_Tourism.xlsx',
        'West_Central_India_Tourism.xlsx'
    ];

    let foundFiles = false;

    for (const file of files) {
        const filePath = path.join(__dirname, '../../../../', file); // Try root
        // Or check current dir if copied
        if (fs.existsSync(filePath)) {
            foundFiles = true;
            console.log(`Found file: ${file}, processing...`);
            // Here we would implement real parsing logic using XLSX
            // const workbook = XLSX.readFile(filePath);
            // ... process sheets ...
        }
    }

    if (!foundFiles) {
        console.log("No Excel files found. Seeding with SAMPLE data for Whole India coverage...");

        await State.deleteMany({});
        await City.deleteMany({});
        await Package.deleteMany({});
        await Place.deleteMany({}); // Clear old

        // Insert States
        await State.insertMany(SAMPLE_STATES);
        console.log(`Seeded ${SAMPLE_STATES.length} states.`);

        // Insert Cities
        const states = await State.find();
        const citiesToInsert = SAMPLE_CITIES.map(c => {
            const state = states.find(s => s.code === c.stateCode);
            // In real app, we map properly. Here stateCode ref is string in schema?
            // My schema says ref='State' but type String. Mongoose populates if ID usually,
            // but let's stick to string code reference for simplicity or update schema to use ObjectId.
            // For now, I used stateCode as string in City schema.
            return c;
        });
        await City.insertMany(citiesToInsert);
        console.log(`Seeded ${citiesToInsert.length} cities.`);

        // Insert Packages
        await Package.insertMany(SAMPLE_PACKAGES);
        console.log(`Seeded ${SAMPLE_PACKAGES.length} packages.`);

        console.log("Database seeded successfully with sample data.");
    }

    process.exit();
}

seedData();
