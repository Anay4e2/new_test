// The Logic Core: Generates the itinerary
import { CITIES as MOCK_CITIES, PLACES as MOCK_PLACES, HOTELS as MOCK_HOTELS, RESTAURANTS as MOCK_RESTAURANTS, FESTIVALS } from './mockData';
import CityModel from '../models/City';
import PlaceModel from '../models/Place';
import mongoose from 'mongoose';
import { getSeasonalWeather } from './weatherService';
import { haversineDistance } from './routeOptimizer';

export type TravelStyle = 'relaxed' | 'fast';
export type BudgetTier = 'budget' | 'standard' | 'premium';

export interface TripRequest {
  stateCode: string;
  stateCodes?: string[]; // multi-state support
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

export interface City {
  _id: string;
  name: string;
  stateCode?: string;
  coordinates?: { lat: number; lng: number };
  idealDays?: number;
}

export interface Place {
  _id: string;
  name: string;
  cityName: string;
  type: string;
  coordinates?: { lat: number; lng: number };
  timeRequired: number;
  openingTime?: string;
  closingTime?: string;
  bestTimeOfDay?: string;
  rating?: number;
  tags?: string[];
  priceTier?: string;
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

export interface MealRecommendation {
  restaurant: string;
  cuisine: string;
  cost: number;
  mustTry: string;
  vegetarian: boolean;
  type: string;
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
    isInterState?: boolean;
    fromState?: string;
    toState?: string;
  };
  nightStay: string | NightStayInfo;
  meals?: {
    breakfast?: MealRecommendation;
    lunch?: MealRecommendation;
    dinner?: MealRecommendation;
  };
  weather?: {
    temp: number;
    condition: string;
    icon: string;
    advisory?: string;
  };
  festival?: {
    name: string;
    type: string;
    description: string;
    crowdLevel: string;
    highlights: string[];
    advisory?: string;
  };
  stats: {
    totalDistance: number;
    totalCost: number;
    feasibility: 'comfortable' | 'tight' | 'impossible';
  };
}

export interface TripResult {
  itinerary: DayItinerary[];
  warnings?: string[];
  summary: {
    totalCost: number;
    totalDistance: number;
    feasibility: 'comfortable' | 'tight' | 'not recommended';
    costBreakup: {
      stay: number;
      transport: number;
      activities: number;
      food: number;
    };
  };
}

// Helper to estimate travel between cities using Haversine distance
const getTravelInfo = (fromCityName: string, toCityName: string) => {
  // Look up coordinates from MOCK_CITIES
  const fromCity = MOCK_CITIES.find(c => c.name === fromCityName);
  const toCity = MOCK_CITIES.find(c => c.name === toCityName);

  let dist = 300; // Default fallback
  if (fromCity?.coordinates && toCity?.coordinates) {
    // Haversine gives straight-line distance; multiply by 1.3 for road factor
    dist = Math.round(haversineDistance(
      fromCity.coordinates.lat, fromCity.coordinates.lng,
      toCity.coordinates.lat, toCity.coordinates.lng
    ) * 1.3);
  }

  // Detect inter-state travel
  const isInterState = !!(fromCity && toCity && fromCity.stateCode !== toCity.stateCode);

  // Choose travel mode based on distance
  let mode = 'Private Taxi';
  let avgSpeed = 60; // km/h
  if (isInterState) {
    if (dist > 500) {
      mode = 'Flight';
      avgSpeed = 500; // effective speed including boarding
    } else {
      mode = 'Train';
      avgSpeed = 80;
    }
  }

  return {
    distance: dist,
    duration: Math.round((dist / avgSpeed) * 10) / 10,
    mode,
    isInterState,
    fromState: fromCity?.stateCode,
    toState: toCity?.stateCode,
  };
};

const COSTS = {
  budget: { stay: 30, food: 15, transportPerKm: 0.15, activityAvg: 5 },
  standard: { stay: 70, food: 35, transportPerKm: 0.30, activityAvg: 15 },
  premium: { stay: 150, food: 80, transportPerKm: 0.80, activityAvg: 30 },
};

// Find the best hotel for a city + budget tier
const findHotel = (cityName: string, tier: BudgetTier): NightStayInfo | null => {
  // Filter hotels matching city and tier, pick highest rated
  const matches = MOCK_HOTELS.filter(
    h => h.cityName.toLowerCase() === cityName.toLowerCase() && h.tier === tier
  );
  if (matches.length === 0) return null;
  const best = matches.sort((a, b) => b.rating - a.rating)[0];
  return {
    city: cityName,
    hotel: {
      name: best.name,
      tier: best.tier,
      pricePerNight: best.pricePerNight,
      rating: best.rating,
      amenities: best.amenities,
    }
  };
};

// Budget tier to restaurant price range mapping
const BUDGET_TO_PRICE_RANGE: Record<BudgetTier, string[]> = {
  budget: ['budget'],
  standard: ['budget', 'moderate'],
  premium: ['moderate', 'expensive'],
};

// Assign meals for a day in a city, avoiding repeats
const assignMeals = (
  cityName: string,
  budget: BudgetTier,
  usedRestaurantIds: Set<string>
): { meals: DayItinerary['meals']; foodCost: number } => {
  const allowedRanges = BUDGET_TO_PRICE_RANGE[budget];
  const cityRestaurants = MOCK_RESTAURANTS.filter(
    r => r.cityName.toLowerCase() === cityName.toLowerCase() && allowedRanges.includes(r.priceRange)
  );

  // Sort by rating descending
  const sorted = [...cityRestaurants].sort((a, b) => b.rating - a.rating);

  const pickRestaurant = (preferred?: string[]): MealRecommendation | undefined => {
    const candidates = preferred
      ? sorted.filter(r => preferred.includes(r.type) && !usedRestaurantIds.has(r._id))
      : sorted.filter(r => !usedRestaurantIds.has(r._id));
    const pick = candidates.length > 0 ? candidates[0] : sorted.filter(r => !usedRestaurantIds.has(r._id))[0];
    if (!pick) return undefined;
    usedRestaurantIds.add(pick._id);
    return {
      restaurant: pick.name,
      cuisine: pick.cuisine[0],
      cost: pick.averageCost,
      mustTry: pick.mustTry[0] || '',
      vegetarian: pick.vegetarian,
      type: pick.type,
    };
  };

  const breakfast = pickRestaurant(['cafe', 'street-food', 'dhaba']);
  const lunch = pickRestaurant(['casual', 'dhaba']);
  const dinner = pickRestaurant(['casual', 'fine-dining']);

  const foodCost = (breakfast?.cost || 0) + (lunch?.cost || 0) + (dinner?.cost || 0);

  return {
    meals: { breakfast, lunch, dinner },
    foodCost,
  };
};


export const generateTrip = async (req: TripRequest): Promise<TripResult> => {
  const { selectedCityIds, duration, budget, travelStyle, constraints } = req;

  // 1. Get Cities Data - try database first, fall back to mock data
  let cities: City[] = [];

  try {
    // Try to fetch from database
    // We need to handle both ObjectId and string ID cases (backward compatibility)
    const validObjectIds = selectedCityIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    const otherIds = selectedCityIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

    let dbCities: any[] = [];

    // 1. Fetch by valid ObjectId
    if (validObjectIds.length > 0) {
      const byId = await CityModel.find({ _id: { $in: validObjectIds } });
      dbCities = [...dbCities, ...byId];
    }

    // 2. Fetch by name or custom string _id for legacy/mock compatibility
    if (otherIds.length > 0) {
      // Try to find by name (case insensitive) or if we had a string _id field
      const byName = await CityModel.find({
        name: { $in: otherIds.map(id => new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) }
      });
      dbCities = [...dbCities, ...byName];
    }

    // Remove duplicates
    const seen = new Set();
    const uniqueDbCities = dbCities.filter(c => {
      const id = c._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    if (uniqueDbCities.length > 0) {
      cities = uniqueDbCities.map(c => ({
        _id: c._id.toString(),
        name: c.name,
        stateCode: c.stateCode,
        coordinates: c.coordinates,
        idealDays: c.idealDays
      }));
    }
  } catch (error) {
    console.log('Database query failed, trying mock data:', error);
  }

  // Fall back to mock data if database returned nothing
  if (cities.length === 0) {
    cities = MOCK_CITIES.filter(c => selectedCityIds.includes(c._id));
  }

  // 2. Sort Cities (Simple TSP - here just nearest neighbor or preserved order if user selected logic)
  // For MVP: Let's assume the user selected them in order, or we just keep them.
  // Ideally: Start at City 0, find nearest, go there.

  // 3. Distribute Days
  const totalCities = cities.length;
  if (totalCities === 0) throw new Error("No cities selected");

  const warnings: string[] = [];

  // Limit cities to duration — can't visit more cities than days available
  if (cities.length > duration) {
    warnings.push(`Only ${duration} of ${cities.length} cities could fit in ${duration} days. Remaining cities were dropped.`);
    cities = cities.slice(0, duration);
  }

  // Basic allocation
  let daysPerCity = Math.floor(duration / cities.length);
  let extraDays = duration % cities.length;

  const itinerary: DayItinerary[] = [];
  let currentDay = 1;
  let totalCost = 0;
  let totalDist = 0;
  const usedRestaurantIds = new Set<string>();
  let costBreakup = { stay: 0, transport: 0, activities: 0, food: 0 };

  const costConfig = COSTS[budget];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const nextCity = cities[i + 1];

    // Allocate days for this city
    let stayDuration = daysPerCity;
    if (extraDays > 0) {
      stayDuration++;
      extraDays--;
    }

    // Get weather for this city (use current month for seasonal data)
    const currentMonth = new Date().getMonth() + 1;
    const weatherInfo = getSeasonalWeather(city.name, currentMonth);

    // Get places for this city
    let cityPlaces = MOCK_PLACES.filter(p => p.cityName === city.name);

    // If extreme heat, prioritize indoor activities by sorting them first
    if (weatherInfo.temp >= 40) {
      const indoorTypes = ['Museum', 'Temple', 'Palace', 'Gallery', 'Shopping'];
      cityPlaces = [
        ...cityPlaces.filter((p: Place) => indoorTypes.includes(p.type)),
        ...cityPlaces.filter((p: Place) => !indoorTypes.includes(p.type)),
      ];
    }

    // Filter constraints
    if (constraints.seniorFriendly) {
      cityPlaces = cityPlaces.filter((p: Place) => (p.tags || []).includes('senior-friendly'));
    }

    // Schedule days in this city
    for (let d = 0; d < stayDuration; d++) {
      if (currentDay > duration) break;

      const dailyActivities: any[] = [];
      let timeUsed = 0;

      // Morning Religious Constraint
      if (constraints.morningReligious) {
        const temples = cityPlaces.filter((p: Place) => p.type === 'Temple' && !dailyActivities.includes(p));
        if (temples.length > 0) {
          dailyActivities.push(temples[0]);
          timeUsed += temples[0].timeRequired;
        }
      }

      // Fill rest of day
      const maxPlaces = travelStyle === 'relaxed' ? 2 : 4;

      for (const place of cityPlaces) {
        // Simple check if place already added in *this* trip?
        // Need to track global visited places if we want to avoid repeats across days?
        // For now, just avoid repeats in daily list (already done)
        // But also check if it was visited in previous days for this city?
        // The loop `cityPlaces = cityPlaces.filter` handles repeats for the *same city* loop.

        if (dailyActivities.includes(place)) continue;
        if (dailyActivities.length >= maxPlaces) break;
        if (timeUsed + place.timeRequired > 8) break; // Max 8 hours sightseeing

        dailyActivities.push(place);
        timeUsed += place.timeRequired;
      }

      // Remove used places so we don't repeat them next day in same city
      cityPlaces = cityPlaces.filter(p => !dailyActivities.includes(p));

      // Find hotel for this night
      const hotelInfo = findHotel(city.name, budget);

      // Assign meal recommendations
      const { meals, foodCost } = assignMeals(city.name, budget, usedRestaurantIds);

      // Calculate Costs — use real hotel price when available
      const dayActivityCost = dailyActivities.length * costConfig.activityAvg;
      const dayStayCost = hotelInfo ? hotelInfo.hotel.pricePerNight : costConfig.stay;

      costBreakup.activities += dayActivityCost;
      costBreakup.stay += dayStayCost;
      costBreakup.food += foodCost;

      const dayPlan: DayItinerary = {
        day: currentDay,
        city: city.name,
        activities: dailyActivities,
        nightStay: hotelInfo || city.name,
        meals,
        weather: {
          temp: weatherInfo.temp,
          condition: weatherInfo.condition,
          icon: weatherInfo.icon,
          advisory: weatherInfo.advisory,
        },
        stats: {
          totalDistance: 0, // Intra-city ignored for MVP stats
          totalCost: dayActivityCost + dayStayCost + foodCost,
          feasibility: weatherInfo.temp >= 42 ? 'tight' : 'comfortable'
        }
      };

      // Check for festivals happening in this city during the trip month
      const tripMonth = new Date().getMonth() + 1; // default to current month
      const cityState = MOCK_CITIES.find(c => c.name === city.name)?.stateCode;
      const matchingFestival = FESTIVALS.find(f =>
        (f.cityName.toLowerCase() === city.name.toLowerCase() || f.cityName === 'all') &&
        (cityState ? f.stateCode.toUpperCase() === cityState.toUpperCase() || f.stateCode === 'ALL' : true) &&
        f.month === tripMonth &&
        (f.impact === 'must-see' || f.impact === 'worth-attending')
      );
      if (matchingFestival) {
        dayPlan.festival = {
          name: matchingFestival.name,
          type: matchingFestival.type,
          description: matchingFestival.description,
          crowdLevel: matchingFestival.crowdLevel,
          highlights: matchingFestival.highlights,
          advisory: matchingFestival.travelAdvisory,
        };
      }

      // Check if we need inter-city travel on this day (Last day in city)
      if (d === stayDuration - 1 && nextCity) {
        const travel = getTravelInfo(city.name, nextCity.name);
        dayPlan.travel = {
          from: city.name,
          to: nextCity.name,
          distance: travel.distance,
          duration: travel.duration,
          mode: travel.mode,
          isInterState: travel.isInterState,
          fromState: travel.fromState,
          toState: travel.toState,
        };
        // When traveling to next city, use that city's hotel for night stay
        const nextHotelInfo = findHotel(nextCity.name, budget);
        dayPlan.nightStay = nextHotelInfo || nextCity.name;

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

  // Overall Feasibility
  let feasibility: 'comfortable' | 'tight' | 'not recommended' = 'comfortable';
  const placesVisited = itinerary.reduce((acc, day) => acc + day.activities.length, 0);
  if (placesVisited < 2 * duration && travelStyle === 'fast') feasibility = 'not recommended'; // Too little
  if (totalCities / duration > 0.5) feasibility = 'tight'; // 1 city per 2 days is okay, but more is tight

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
