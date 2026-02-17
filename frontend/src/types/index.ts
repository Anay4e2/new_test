export type TravelStyle = 'relaxed' | 'fast';
export type BudgetTier = 'budget' | 'standard' | 'premium';

export interface TripRequest {
  stateCode: string;
  stateCodes?: string[];
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
      food: number;
    };
  };
}

export interface City {
  _id: string;
  name: string;
  stateCode: string;
  coordinates: { lat: number; lng: number };
  tier: 'tier1' | 'tier2' | 'tier3';
  description: string;
  idealDays: number;
  imageUrl?: string;
}

export interface Place {
  _id: string;
  name: string;
  cityName: string;
  type: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  visitDuration?: string;
  entryFee?: string;
  bestTime?: string;
  timeRequired: number;
  openingTime: string;
  closingTime: string;
  bestTimeOfDay: string;
  rating: number;
  tags: string[];
  priceTier: 'free' | 'low' | 'medium' | 'high';
  images?: string[];
  thumbnailUrl?: string;
}

export interface State {
  _id: string;
  code: string;
  name: string;
  center: { lat: number; lng: number };
  zoom: number;
  description: string;
  imageUrl?: string;
}

export interface Package {
  _id: string;
  id: string;
  title: string;
  state: string;
  days: number;
  price: number;
  image: string;
  description: string;
  tags: string[];
  places: string[];
  cities: string[];
  isActive: boolean;
  createdAt: string;
  placesDetails?: Place[];
}

export interface Hotel {
  _id: string;
  name: string;
  cityName: string;
  stateCode: string;
  coordinates: { lat: number; lng: number };
  tier: BudgetTier;
  pricePerNight: number;
  rating: number;
  amenities: string[];
  imageUrl?: string;
  contactPhone?: string;
  bookingUrl?: string;
  description: string;
}

export interface Restaurant {
  _id: string;
  name: string;
  cityName: string;
  cuisine: string[];
  type: 'street-food' | 'casual' | 'fine-dining' | 'dhaba' | 'cafe';
  priceRange: 'budget' | 'moderate' | 'expensive';
  averageCost: number;
  rating: number;
  mustTry: string[];
  coordinates: { lat: number; lng: number };
  openingTime: string;
  closingTime: string;
  vegetarian: boolean;
  description: string;
}

export interface SavedTrip {
  _id: string;
  userId: string;
  title: string;
  tripRequest: TripRequest;
  tripResult: TripResult;
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoritePlace {
  _id: string;
  userId: string;
  placeId: string;
  placeName: string;
  cityName: string;
  addedAt: string;
}
