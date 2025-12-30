import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import mongoose from 'mongoose';
import State from '../models/State';
import City from '../models/City';
import Place from '../models/Place';
import connectDB from '../config/db';

interface ExcelRow {
    State?: string;
    City?: string;
    Place?: string;
    Type?: string;
    Latitude?: number;
    Longitude?: number;
    'Time Required (hours)'?: number;
    'Opening Time'?: string;
    'Closing Time'?: string;
    'Best Time'?: string;
    Rating?: number;
    Tags?: string;
    'Price Tier'?: string;
    Description?: string;
    'Ideal Days'?: number;
    Tier?: string;
    Region?: string;
    'Place Name'?: string;
    Category?: string;
    'Visit Duration'?: number;
    'Entry Fee'?: string;
}

// Helper function to determine region from filename
function getRegionFromFilename(filename: string): string {
    if (filename.includes('North')) return 'North';
    if (filename.includes('South')) return 'South';
    if (filename.includes('East')) return 'East';
    if (filename.includes('West')) return 'West';
    if (filename.includes('Central')) return 'Central';
    return 'Other';
}

// Helper function to generate state code
function generateStateCode(stateName: string): string {
    return stateName
        .toUpperCase()
        .replace(/\s+/g, '_')
        .substring(0, 10);
}

async function parseExcelFiles() {
    const excelsDir = path.join(__dirname, '../../../excels');
    const files = fs.readdirSync(excelsDir).filter(file => file.endsWith('.xlsx'));

    console.log(`Found ${files.length} Excel files to process`);

    const statesMap = new Map<string, any>();
    const citiesMap = new Map<string, any>();
    const places: any[] = [];

    for (const file of files) {
        console.log(`\nProcessing file: ${file}`);
        const filePath = path.join(excelsDir, file);
        const workbook = XLSX.readFile(filePath);
        const region = getRegionFromFilename(file);

        // Iterate through all sheets in the workbook
        for (const sheetName of workbook.SheetNames) {
            console.log(`  Processing sheet: ${sheetName}`);
            const worksheet = workbook.Sheets[sheetName];
            const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

            console.log(`    Found ${data.length} rows in ${sheetName}`);

            if (data.length > 0) {
                const cols = Object.keys(data[0] as object);
                console.log(`    Columns found: ${cols.length}`);
            }

            for (const row of data) {
                // Process State
                if (row.State) {
                    const stateCode = generateStateCode(row.State);
                    if (!statesMap.has(stateCode)) {
                        statesMap.set(stateCode, {
                            code: stateCode,
                            name: row.State,
                            description: row.Description || `Explore the beautiful state of ${row.State}`,
                            imageUrl: `/images/states/${stateCode.toLowerCase()}.jpg`,
                            region: row.Region || region,
                            center: {
                                lat: row.Latitude || 20.5937,
                                lng: row.Longitude || 78.9629
                            },
                            zoom: 7
                        });
                    }
                }

                // Process City
                if (row.City && row.State) {
                    const stateCode = generateStateCode(row.State);
                    const cityKey = `${row.City}_${stateCode}`;

                    if (!citiesMap.has(cityKey)) {
                        citiesMap.set(cityKey, {
                            name: row.City,
                            stateCode: stateCode,
                            coordinates: {
                                lat: row.Latitude || 20.5937,
                                lng: row.Longitude || 78.9629
                            },
                            tier: (row.Tier?.toLowerCase() as 'tier1' | 'tier2' | 'tier3') || 'tier2',
                            description: row.Description || `Visit ${row.City}, a wonderful destination in ${row.State}`,
                            idealDays: row['Ideal Days'] || 2,
                            imageUrl: `/images/cities/${row.City.toLowerCase().replace(/\s+/g, '-')}.jpg`
                        });
                    }
                }

                // Process Place - check for "Place" or "Place Name"
                const placeName = row.Place || row['Place Name'];
                if (placeName && row.City) {
                    places.push({
                        name: placeName,
                        cityName: row.City,
                        type: row.Type || row.Category || 'Attraction',
                        coordinates: {
                            lat: row.Latitude || 20.5937,
                            lng: row.Longitude || 78.9629
                        },
                        timeRequired: parseFloat(String(row['Time Required (hours)'] || row['Visit Duration'] || 2)) || 2,
                        openingTime: row['Opening Time'] || '09:00',
                        closingTime: row['Closing Time'] || '18:00',
                        bestTimeOfDay: row['Best Time'] || 'day',
                        rating: parseFloat(String(row.Rating || 4.0)) || 4.0,
                        tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : [],
                        priceTier: (row['Price Tier']?.toLowerCase() as 'free' | 'low' | 'medium' | 'high') ||
                            (row['Entry Fee']?.toLowerCase().includes('free') ? 'free' : 'medium') || 'medium'
                    });
                }
            }
        }
    }

    return {
        states: Array.from(statesMap.values()),
        cities: Array.from(citiesMap.values()),
        places
    };
}

async function seedDatabase() {
    try {
        console.log('Starting database seeding process...\n');

        // Connect to database
        await connectDB();

        // Parse Excel files
        const { states, cities, places } = await parseExcelFiles();

        console.log('\n=== Parsed Data Summary ===');
        console.log(`States: ${states.length}`);
        console.log(`Cities: ${cities.length}`);
        console.log(`Places: ${places.length}`);

        // Clear existing data
        console.log('\nClearing existing data...');
        await State.deleteMany({});
        await City.deleteMany({});
        await Place.deleteMany({});

        // Insert new data
        console.log('\nInserting new data...');

        if (states.length > 0) {
            await State.insertMany(states);
            console.log(`✓ Inserted ${states.length} states`);
        }

        if (cities.length > 0) {
            await City.insertMany(cities);
            console.log(`✓ Inserted ${cities.length} cities`);
        }

        if (places.length > 0) {
            await Place.insertMany(places);
            console.log(`✓ Inserted ${places.length} places`);
        }

        console.log('\n✅ Database seeding completed successfully!');

        // Display sample data
        console.log('\n=== Sample Data ===');
        const sampleState = await State.findOne();
        const sampleCity = await City.findOne();
        const samplePlace = await Place.findOne();

        if (sampleState) console.log('Sample State:', sampleState.name);
        if (sampleCity) console.log('Sample City:', sampleCity.name);
        if (samplePlace) console.log('Sample Place:', samplePlace.name);

    } catch (error) {
        console.error('Error seeding database:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the seeding function
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

export default seedDatabase;
