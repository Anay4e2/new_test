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
