// The Logic Core: Generates the itinerary
import { MOCK_CITIES, MOCK_PLACES } from './mockData';
import { v4 as uuidv4 } from 'uuid';

export type TravelStyle = 'relaxed' | 'fast';
export type BudgetTier = 'budget' | 'standard' | 'premium';

export interface TripRequest {
  stateCode: string;
  selectedCityIds: string[];
  duration: number; // in days
  budget: BudgetTier;
  travelStyle: TravelStyle;
  constraints: {
    maxTravelHoursPerDay: number;
    seniorFriendly: boolean;
    morningReligious: boolean;
    noNightTravel: boolean;
  };
}

export interface DayItinerary {
  day: number;
  date?: string;
  city: string;
  activities: any[];
  travel?: {
    from: string;
    to: string;
    distance: number;
    duration: number; // hours
    mode: string;
  };
  nightStay: string;
  stats: {
    totalDistance: number;
    totalCost: number;
    feasibility: 'comfortable' | 'tight' | 'impossible';
  };
}

export interface TripResult {
  itinerary: DayItinerary[];
  summary: {
    totalCost: number;
    totalDistance: number;
    feasibility: 'comfortable' | 'tight' | 'not recommended';
    costBreakup: {
      stay: number;
      transport: number;
      activities: number;
    };
  };
}

// Helper to estimate travel between cities (Simple mock for MVP)
const getTravelInfo = (fromCityName: string, toCityName: string) => {
  // Mock distances matrix
  const distances: Record<string, number> = {
    'Jaipur-Jodhpur': 350,
    'Jodhpur-Udaipur': 250,
    'Jodhpur-Jaisalmer': 280,
    'Udaipur-Jodhpur': 250,
    'Jaipur-Udaipur': 400,
    // Add reverse and others as defaults
  };

  const key = `${fromCityName}-${toCityName}`;
  const reverseKey = `${toCityName}-${fromCityName}`;
  const dist = distances[key] || distances[reverseKey] || 300; // Default 300km

  return {
    distance: dist,
    duration: dist / 60, // Avg 60 km/h
  };
};

const COSTS = {
  budget: { stay: 30, food: 15, transportPerKm: 0.15, activityAvg: 5 },
  standard: { stay: 70, food: 35, transportPerKm: 0.30, activityAvg: 15 },
  premium: { stay: 150, food: 80, transportPerKm: 0.80, activityAvg: 30 },
};

export const generateTrip = async (req: TripRequest): Promise<TripResult> => {
  const { selectedCityIds, duration, budget, travelStyle, constraints } = req;

  // 1. Get Cities Data
  const cities = MOCK_CITIES.filter(c => selectedCityIds.includes(c._id));

  // 2. Sort Cities (Simple TSP - here just nearest neighbor or preserved order if user selected logic)
  // For MVP: Let's assume the user selected them in order, or we just keep them.
  // Ideally: Start at City 0, find nearest, go there.

  // 3. Distribute Days
  const totalCities = cities.length;
  if (totalCities === 0) throw new Error("No cities selected");

  // Basic allocation
  let daysPerCity = Math.floor(duration / totalCities);
  let extraDays = duration % totalCities;

  const itinerary: DayItinerary[] = [];
  let currentDay = 1;
  let totalCost = 0;
  let totalDist = 0;
  let costBreakup = { stay: 0, transport: 0, activities: 0 };

  const costConfig = COSTS[budget];

  for (let i = 0; i < totalCities; i++) {
    const city = cities[i];
    const nextCity = cities[i + 1];

    // Allocate days for this city
    let stayDuration = daysPerCity;
    if (extraDays > 0) {
      stayDuration++;
      extraDays--;
    }

    // Get places for this city
    let cityPlaces = MOCK_PLACES.filter(p => p.cityName === city.name);

    // Filter constraints
    if (constraints.seniorFriendly) {
      cityPlaces = cityPlaces.filter(p => p.tags.includes('senior-friendly'));
    }

    // Schedule days in this city
    for (let d = 0; d < stayDuration; d++) {
      if (currentDay > duration) break;

      const dailyActivities: any[] = [];
      let timeUsed = 0;

      // Morning Religious Constraint
      if (constraints.morningReligious) {
        const temples = cityPlaces.filter(p => p.type === 'Temple' && !dailyActivities.includes(p));
        if (temples.length > 0) {
           dailyActivities.push(temples[0]);
           timeUsed += temples[0].timeRequired;
        }
      }

      // Fill rest of day
      const maxPlaces = travelStyle === 'relaxed' ? 2 : 4;

      for (const place of cityPlaces) {
        if (dailyActivities.includes(place)) continue;
        if (dailyActivities.length >= maxPlaces) break;
        if (timeUsed + place.timeRequired > 8) break; // Max 8 hours sightseeing

        dailyActivities.push(place);
        timeUsed += place.timeRequired;
      }

      // Remove used places so we don't repeat them next day in same city
      cityPlaces = cityPlaces.filter(p => !dailyActivities.includes(p));

      // Calculate Costs
      const dayActivityCost = dailyActivities.length * costConfig.activityAvg;
      const dayStayCost = costConfig.stay; // Per night
      const dayFoodCost = costConfig.food;

      costBreakup.activities += dayActivityCost;
      costBreakup.stay += dayStayCost;
      // Food is implicitly part of "Stay/Living" in this simple model or separate?
      // Let's add food to stay for simplicity or split. The prompt asks for Stay, Transport, Activities.
      // We will add Food to Stay for now or ignore. Let's ignore food or bundle it.
      // Let's bundle food into Stay/Daily Living.
      costBreakup.stay += dayFoodCost;

      const dayPlan: DayItinerary = {
        day: currentDay,
        city: city.name,
        activities: dailyActivities,
        nightStay: city.name,
        stats: {
          totalDistance: 0, // Intra-city ignored for MVP stats
          totalCost: dayActivityCost + dayStayCost + dayFoodCost,
          feasibility: 'comfortable'
        }
      };

      // Check if we need inter-city travel on this day (Last day in city)
      if (d === stayDuration - 1 && nextCity) {
        const travel = getTravelInfo(city.name, nextCity.name);
        dayPlan.travel = {
          from: city.name,
          to: nextCity.name,
          distance: travel.distance,
          duration: travel.duration,
          mode: 'Private Taxi'
        };
        dayPlan.nightStay = nextCity.name; // Reach next city by night

        const travelCost = travel.distance * costConfig.transportPerKm;
        costBreakup.transport += travelCost;
        totalDist += travel.distance;

        // Feasibility check: Travel time
        if (constraints.maxTravelHoursPerDay && travel.duration > constraints.maxTravelHoursPerDay) {
          dayPlan.stats.feasibility = 'impossible'; // Or warning
        }
      }

      itinerary.push(dayPlan);
      currentDay++;
    }
  }

  totalCost = costBreakup.stay + costBreakup.transport + costBreakup.activities;

  // Overall Feasibility
  let feasibility: 'comfortable' | 'tight' | 'not recommended' = 'comfortable';
  const placesVisited = itinerary.reduce((acc, day) => acc + day.activities.length, 0);
  if (placesVisited < 2 * duration && travelStyle === 'fast') feasibility = 'not recommended'; // Too little
  if (totalCities / duration > 0.5) feasibility = 'tight'; // 1 city per 2 days is okay, but more is tight

  return {
    itinerary,
    summary: {
      totalCost,
      totalDistance: totalDist,
      feasibility,
      costBreakup
    }
  };
};
