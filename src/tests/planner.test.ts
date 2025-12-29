// src/tests/planner.test.ts
import { generateTrip, TripRequest } from '../lib/planner';
import { MOCK_CITIES } from '../lib/mockData';

// Mock data is already imported in planner, but we can verify outputs

async function runTests() {
    console.log('Running Planner Logic Tests...');

    // Test 1
    try {
        const req: TripRequest = {
            stateCode: 'RJ',
            selectedCityIds: ['jaipur', 'udaipur'],
            duration: 6,
            budget: 'standard',
            travelStyle: 'relaxed',
            constraints: {
                maxTravelHoursPerDay: 8,
                seniorFriendly: false,
                morningReligious: false,
                noNightTravel: true
            }
        };

        const result = await generateTrip(req);

        if (!result.itinerary || result.itinerary.length === 0) throw new Error('Itinerary is empty');
        if (result.itinerary.length > 6) throw new Error('Generated more days than requested');
        if (result.summary.totalCost <= 0) throw new Error('Total cost should be positive');

        console.log('✅ Test Passed: Generated ' + result.itinerary.length + ' days.');
    } catch (e) {
        console.error('❌ Test Failed: Standard Request', e);
        process.exit(1);
    }

    // Test 2
    try {
        const req: TripRequest = {
            stateCode: 'RJ',
            selectedCityIds: ['jaipur'],
            duration: 2,
            budget: 'budget',
            travelStyle: 'fast',
            constraints: {
                maxTravelHoursPerDay: 8,
                seniorFriendly: false,
                morningReligious: false,
                noNightTravel: true
            }
        };

        const result = await generateTrip(req);
        if (result.itinerary.length !== 2) throw new Error('Should have 2 days');
        console.log('✅ Test Passed: Single city handled.');
    } catch (e) {
        console.error('❌ Test Failed: Single City', e);
        process.exit(1);
    }
}

runTests();
