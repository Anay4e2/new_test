import { describe, it, expect, vi } from 'vitest';
import { generateTrip, TripRequest } from '../planner';

// Mock mongoose to avoid DB connection attempts
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...(actual as object),
    default: {
      ...(actual as any).default,
      Types: (actual as any).Types,
    },
  };
});

// Mock CityModel and PlaceModel to return empty arrays
vi.mock('../../models/City', () => ({
  default: { find: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../models/Place', () => ({
  default: { find: vi.fn().mockResolvedValue([]) },
}));

describe('Backend Planner Smoke Test', () => {
  it('should generate an itinerary for Rajasthan using mock data', async () => {
    const req: TripRequest = {
      stateCode: 'RJ',
      selectedCityIds: ['jaipur', 'udaipur'],
      duration: 4,
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
    expect(result.itinerary.length).toBeLessThanOrEqual(4);
    expect(result.summary.totalCost).toBeGreaterThan(0);
    expect(result.summary.totalDistance).toBeGreaterThanOrEqual(0);
  });
});
