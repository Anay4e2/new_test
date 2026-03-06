import { describe, it, expect } from 'vitest';
import { generateTripSchema, optimizeRouteSchema, saveTripSchema, updateTripSchema, addExpenseSchema, createGroupSchema, inviteMembersSchema, createReviewSchema, createJournalSchema, objectIdParam } from '../../lib/validationSchemas';

describe('Trip Validation Schemas', () => {
  describe('generateTripSchema', () => {
    const validTrip = {
      selectedCityIds: ['city1'],
      duration: 5,
      budget: 'standard',
      travelStyle: 'relaxed',
    };

    it('accepts valid trip request', () => {
      const result = generateTripSchema.safeParse(validTrip);
      expect(result.success).toBe(true);
    });

    it('provides default constraints', () => {
      const result = generateTripSchema.safeParse(validTrip);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.constraints.maxTravelHoursPerDay).toBe(6);
        expect(result.data.constraints.seniorFriendly).toBe(false);
      }
    });

    it('rejects empty selectedCityIds', () => {
      const result = generateTripSchema.safeParse({ ...validTrip, selectedCityIds: [] });
      expect(result.success).toBe(false);
    });

    it('rejects duration > 30', () => {
      const result = generateTripSchema.safeParse({ ...validTrip, duration: 31 });
      expect(result.success).toBe(false);
    });

    it('rejects duration < 1', () => {
      const result = generateTripSchema.safeParse({ ...validTrip, duration: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid budget', () => {
      const result = generateTripSchema.safeParse({ ...validTrip, budget: 'luxury' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid travelStyle', () => {
      const result = generateTripSchema.safeParse({ ...validTrip, travelStyle: 'moderate' });
      expect(result.success).toBe(false);
    });

    it('coerces string duration to number', () => {
      const result = generateTripSchema.safeParse({ ...validTrip, duration: '7' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.duration).toBe(7);
    });
  });

  describe('optimizeRouteSchema', () => {
    it('accepts valid data', () => {
      const result = optimizeRouteSchema.safeParse({ placeIds: ['p1', 'p2'] });
      expect(result.success).toBe(true);
    });

    it('rejects empty placeIds', () => {
      const result = optimizeRouteSchema.safeParse({ placeIds: [] });
      expect(result.success).toBe(false);
    });
  });
});

describe('Saved Trip Schemas', () => {
  describe('saveTripSchema', () => {
    it('accepts valid saved trip', () => {
      const result = saveTripSchema.safeParse({
        title: 'My Trip',
        tripRequest: { selectedCityIds: ['c1'] },
        tripResult: { itinerary: [] },
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing title', () => {
      const result = saveTripSchema.safeParse({
        tripRequest: {},
        tripResult: {},
      });
      expect(result.success).toBe(false);
    });

    it('rejects title over 200 chars', () => {
      const result = saveTripSchema.safeParse({
        title: 'a'.repeat(201),
        tripRequest: {},
        tripResult: {},
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTripSchema', () => {
    it('accepts partial update', () => {
      const result = updateTripSchema.safeParse({ isFavorite: true });
      expect(result.success).toBe(true);
    });

    it('accepts notes', () => {
      const result = updateTripSchema.safeParse({ notes: 'Great trip!' });
      expect(result.success).toBe(true);
    });
  });
});

describe('Expense Schemas', () => {
  describe('addExpenseSchema', () => {
    it('accepts valid expense', () => {
      const result = addExpenseSchema.safeParse({
        tripId: 'trip123',
        category: 'food',
        amount: 250,
        day: 1,
      });
      expect(result.success).toBe(true);
    });

    it('rejects negative amount', () => {
      const result = addExpenseSchema.safeParse({
        tripId: 'trip123',
        category: 'food',
        amount: -10,
        day: 1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = addExpenseSchema.safeParse({
        tripId: 'trip123',
        category: 'gambling',
        amount: 100,
        day: 1,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Group Schemas', () => {
  describe('createGroupSchema', () => {
    it('accepts valid group', () => {
      const result = createGroupSchema.safeParse({ tripId: 'abc', name: 'Team' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = createGroupSchema.safeParse({ tripId: 'abc', name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('inviteMembersSchema', () => {
    it('accepts valid invitation', () => {
      const result = inviteMembersSchema.safeParse({
        emails: ['a@b.com', 'c@d.com'],
        role: 'editor',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email in list', () => {
      const result = inviteMembersSchema.safeParse({
        emails: ['not-email'],
        role: 'viewer',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty emails', () => {
      const result = inviteMembersSchema.safeParse({ emails: [] });
      expect(result.success).toBe(false);
    });
  });
});

describe('Review & Journal Schemas', () => {
  describe('createReviewSchema', () => {
    it('accepts valid review', () => {
      const result = createReviewSchema.safeParse({
        placeId: 'place1',
        placeName: 'Taj Mahal',
        rating: 5,
      });
      expect(result.success).toBe(true);
    });

    it('rejects rating > 5', () => {
      const result = createReviewSchema.safeParse({
        placeId: 'place1',
        placeName: 'Taj',
        rating: 6,
      });
      expect(result.success).toBe(false);
    });

    it('rejects rating < 1', () => {
      const result = createReviewSchema.safeParse({
        placeId: 'place1',
        placeName: 'Taj',
        rating: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createJournalSchema', () => {
    it('accepts valid journal entry', () => {
      const result = createJournalSchema.safeParse({
        tripId: 'trip1',
        day: 1,
        city: 'Jaipur',
        title: 'Day 1 in Jaipur',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing city', () => {
      const result = createJournalSchema.safeParse({
        tripId: 'trip1',
        day: 1,
        title: 'Day 1',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('objectIdParam', () => {
  it('accepts valid MongoDB ObjectId', () => {
    const result = objectIdParam.safeParse({ id: '507f1f77bcf86cd799439011' });
    expect(result.success).toBe(true);
  });

  it('rejects short string', () => {
    const result = objectIdParam.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects non-hex characters', () => {
    const result = objectIdParam.safeParse({ id: 'zzzzzzzzzzzzzzzzzzzzzzzz' });
    expect(result.success).toBe(false);
  });
});
