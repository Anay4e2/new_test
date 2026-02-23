// The Logic Core: Generates the itinerary
import { MOCK_CITIES, MOCK_PLACES } from './mockData';

export type TravelStyle = 'relaxed' | 'fast';
export type BudgetTier = 'budget' | 'standard' | 'premium';

export interface PlaceData {
  _id: string;
  name: string;
  cityName: string;
  type: string;
  description?: string;
  coordinates: { lat: number; lng: number };
  timeRequired: number;
  openingTime?: string;
  closingTime?: string;
  bestTimeOfDay: string;
  rating: number;
  tags: string[];
  priceTier: string;
  imageUrl?: string;
}

export interface TripRequest {
  stateCode: string;
  selectedCityIds: string[];
  duration: number; // in days
  startDate?: string; // ISO date string, e.g. "2026-03-15"
  budget: BudgetTier;
  travelStyle: TravelStyle;
  constraints: {
    maxTravelHoursPerDay: number;
    seniorFriendly: boolean;
    morningReligious: boolean;
    noNightTravel: boolean;
  };
}

export interface NightStayInfo {
  city: string;
  hotel: {
    name: string;
    tier: string;
    pricePerNight: number;
    rating: number;
    amenities: string[];
  };
}

export interface DayItinerary {
  day: number;
  date?: string;
  city: string;
  activities: PlaceData[];
  travel?: {
    from: string;
    to: string;
    distance: number;
    duration: number; // hours
    mode: string;
  };
  nightStay: string | NightStayInfo;
  stats: {
    totalDistance: number;
    totalCost: number;
    feasibility: 'comfortable' | 'tight' | 'impossible';
  };
}

export interface TripResult {
  error?: string;
  itinerary: DayItinerary[];
  warnings: string[];
  summary: {
    totalCost: number;
    totalDistance: number;
    feasibility: 'comfortable' | 'tight' | 'not recommended' | 'impossible';
    costBreakup: {
      stay: number;
      transport: number;
      activities: number;
      food: number;
    };
  };
}

// Helper to estimate travel between cities (Simple mock for MVP)
const getTravelInfo = (fromCityName: string, toCityName: string) => {
  // Mock distances matrix
  const distances: Record<string, number> = {
    'Jaipur-Jodhpur': 350,
    'Jaipur-Udaipur': 400,
    'Jaipur-Jaisalmer': 560,
    'Jodhpur-Udaipur': 250,
    'Jodhpur-Jaisalmer': 280,
    'Udaipur-Jaisalmer': 530,
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
  budget: { stay: 1200, food: 500, transportPerKm: 8, activityAvg: 200 },
  standard: { stay: 3500, food: 1200, transportPerKm: 14, activityAvg: 500 },
  premium: { stay: 10000, food: 3000, transportPerKm: 25, activityAvg: 1500 },
};

const PRICE_TIER_MULTIPLIER: Record<string, number> = {
  free: 0,
  low: 0.5,
  medium: 1,
  high: 2,
};

export const generateTrip = async (req: TripRequest): Promise<TripResult> => {
  const { selectedCityIds, duration, budget, travelStyle, constraints } = req;

  const tripStartDate = req.startDate ? new Date(req.startDate) : new Date();
  if (isNaN(tripStartDate.getTime())) {
    return { error: 'Invalid start date format', itinerary: [], warnings: [], summary: { totalCost: 0, totalDistance: 0, feasibility: 'impossible' as const, costBreakup: { stay: 0, transport: 0, activities: 0, food: 0 } } };
  }

  // 1. Get Cities Data
  const selectedCities = MOCK_CITIES.filter(c => selectedCityIds.includes(c._id));

  // 2. Nearest-Neighbor TSP: start from the first selected city, always visit closest next
  const cities: typeof selectedCities = [];
  const remaining = [...selectedCities];
  if (remaining.length > 0) {
    cities.push(remaining.shift()!);
    while (remaining.length > 0) {
      const last = cities[cities.length - 1];
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let j = 0; j < remaining.length; j++) {
        const d = getTravelInfo(last.name, remaining[j].name).distance;
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      cities.push(remaining.splice(bestIdx, 1)[0]);
    }
  }

  // 3. Distribute Days
  const totalCities = cities.length;
  if (totalCities === 0) throw new Error("No cities selected");

  // Basic allocation — ensure every city gets at least 1 day
  const effectiveCities = Math.min(totalCities, duration); // Can't visit more cities than days
  let daysPerCity = Math.max(1, Math.floor(duration / effectiveCities));
  let extraDays = duration - (daysPerCity * effectiveCities);

  const itinerary: DayItinerary[] = [];
  let currentDay = 1;
  let totalCost = 0;
  let totalDist = 0;
  let costBreakup = { stay: 0, transport: 0, activities: 0, food: 0 };

  const costConfig = COSTS[budget];
  let morningTravelHours = 0; // Hours consumed by early-morning inter-city travel

  for (let i = 0; i < effectiveCities; i++) {
    const city = cities[i];
    const nextCity = cities[i + 1];

    // Allocate days for this city
    let stayDuration = daysPerCity;
    if (extraDays > 0) {
      stayDuration++;
      extraDays--;
    }

    // Get places for this city, sorted by rating (higher first for prioritization)
    let cityPlaces: PlaceData[] = MOCK_PLACES.filter(p => p.cityName === city.name);

    // Filter constraints
    if (constraints.seniorFriendly) {
      cityPlaces.sort((a, b) => {
        const aFriendly = a.tags.includes('senior-friendly') ? 0 : 1;
        const bFriendly = b.tags.includes('senior-friendly') ? 0 : 1;
        return aFriendly - bFriendly;
      });
      // Also filter out places that are explicitly strenuous
      cityPlaces = cityPlaces.filter(p => !p.tags.includes('adventure') && !p.tags.includes('trekking'));
    }

    // Sort places by best time of day for optimal scheduling, then by rating (higher first)
    const timeOrder: Record<string, number> = { 'morning': 0, 'any': 1, 'afternoon': 2, 'evening': 3 };
    cityPlaces.sort((a, b) => {
      const timeDiff = (timeOrder[a.bestTimeOfDay] || 1) - (timeOrder[b.bestTimeOfDay] || 1);
      if (timeDiff !== 0) return timeDiff;
      return (b.rating || 0) - (a.rating || 0); // Higher rated first within same time slot
    });

    // Track used places across days in same city
    const usedPlaceIds = new Set<string>();

    // Max sightseeing hours from user constraint or default 8
    const maxSightseeingHours = constraints.maxTravelHoursPerDay || 8;

    // Schedule days in this city
    for (let d = 0; d < stayDuration; d++) {
      if (currentDay > duration) break;

      const dailyActivities: PlaceData[] = [];
      let timeUsed = morningTravelHours; // Account for early morning inter-city travel
      let currentHour = 9 + morningTravelHours; // Shift start if arrived this morning
      morningTravelHours = 0; // Reset after using it

      // Morning Religious Constraint - start earlier (applied every day, not just first)
      if (constraints.morningReligious) {
        currentHour = 6; // Temples open early
        const temples = cityPlaces.filter(p => p.type === 'Temple' && !usedPlaceIds.has(p._id));
        if (temples.length > 0) {
          dailyActivities.push(temples[0]);
          usedPlaceIds.add(temples[0]._id);
          const transitTime = 0.5;
          timeUsed += temples[0].timeRequired + transitTime;
          currentHour += temples[0].timeRequired + transitTime;
        }
      }

      // Fill rest of day
      const maxPlaces = travelStyle === 'relaxed' ? 2 : 4;

      for (const place of cityPlaces) {
        if (usedPlaceIds.has(place._id)) continue;
        if (dailyActivities.length >= maxPlaces) break;

        const transitTime = dailyActivities.length > 0 ? 0.5 : 0; // Transit between places
        if (timeUsed + place.timeRequired + transitTime > maxSightseeingHours) break;

        // Parse opening/closing times
        const openHour = place.openingTime ? parseInt(place.openingTime.split(':')[0]) : 0;
        const closeHour = place.closingTime ? parseInt(place.closingTime.split(':')[0]) : 24;

        // Check if we can visit within operating hours
        if (currentHour + transitTime < openHour) currentHour = openHour; // Wait for it to open
        else currentHour += transitTime;
        if (currentHour + place.timeRequired > closeHour) continue; // Won't finish before closing

        dailyActivities.push(place);
        usedPlaceIds.add(place._id);
        timeUsed += place.timeRequired + transitTime;
        currentHour += place.timeRequired;
      }

      // Calculate Costs (using priceTier multiplier instead of flat rate)
      let dayActivityCost = 0;
      for (const act of dailyActivities) {
        const multiplier = PRICE_TIER_MULTIPLIER[act.priceTier] ?? 1;
        dayActivityCost += costConfig.activityAvg * multiplier;
      }
      const dayStayCost = costConfig.stay; // Per night
      const dayFoodCost = costConfig.food;

      costBreakup.activities += dayActivityCost;
      costBreakup.stay += dayStayCost;
      costBreakup.food += dayFoodCost;

      const dayDate = new Date(tripStartDate);
      dayDate.setDate(dayDate.getDate() + currentDay - 1);

      const dayPlan: DayItinerary = {
        day: currentDay,
        date: dayDate.toISOString().split('T')[0],
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

        // If noNightTravel is enabled and travel would arrive after ~8pm,
        // schedule travel for early morning instead
        const estimatedDepartureHour = 17; // Assume departing after sightseeing at 5pm
        const arrivalHour = estimatedDepartureHour + travel.duration;

        if (constraints.noNightTravel && arrivalHour > 20) {
          dayPlan.travel = {
            from: city.name,
            to: nextCity.name,
            distance: travel.distance,
            duration: travel.duration,
            mode: 'Private Taxi (Early Morning Departure)'
          };
          dayPlan.nightStay = city.name; // Stay in current city, travel next morning
          morningTravelHours = travel.duration; // Next day starts later due to travel
        } else {
          dayPlan.travel = {
            from: city.name,
            to: nextCity.name,
            distance: travel.distance,
            duration: travel.duration,
            mode: 'Private Taxi'
          };
          dayPlan.nightStay = nextCity.name; // Reach next city by night
        }

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

  totalCost = costBreakup.stay + costBreakup.transport + costBreakup.activities + costBreakup.food;

  // Overall Feasibility (check in ascending severity so the worst wins)
  let feasibility: 'comfortable' | 'tight' | 'not recommended' = 'comfortable';
  const placesVisited = itinerary.reduce((acc, day) => acc + day.activities.length, 0);
  if (totalCities / duration > 0.5) feasibility = 'tight';
  if (placesVisited < 2 * duration && travelStyle === 'fast') feasibility = 'not recommended';

  // Warnings
  const warnings: string[] = [];
  if (totalCities > duration) {
    warnings.push(`You selected ${totalCities} cities for ${duration} day(s). Some cities may get very little time.`);
  }
  const visitedCityNames = new Set(itinerary.map(d => d.city));
  const skippedCities = cities.filter(c => !visitedCityNames.has(c.name));
  if (skippedCities.length > 0) {
    warnings.push(`These cities could not be fit into the itinerary: ${skippedCities.map(c => c.name).join(', ')}.`);
  }

  return {
    itinerary,
    warnings,
    summary: {
      totalCost,
      totalDistance: totalDist,
      feasibility,
      costBreakup
    }
  };
};
