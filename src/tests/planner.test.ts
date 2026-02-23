// src/tests/planner.test.ts
import { describe, it, expect } from 'vitest';
import { generateTrip, TripRequest } from '../lib/planner';

describe('Planner Logic', () => {
  it('should generate a multi-city itinerary within duration', async () => {
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
        noNightTravel: true,
      },
    };

    const result = await generateTrip(req);

    expect(result.itinerary).toBeDefined();
    expect(result.itinerary.length).toBeGreaterThan(0);
    expect(result.itinerary.length).toBeLessThanOrEqual(6);
    expect(result.summary.totalCost).toBeGreaterThan(0);
  });

  it('should handle a single city trip', async () => {
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
        noNightTravel: true,
      },
    };

    const result = await generateTrip(req);
    expect(result.itinerary.length).toBe(2);
  });
});
