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
  isPublic?: boolean;
  likes?: number;
  tags?: string[];
  coverImage?: string;
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

export interface PackingItem {
  name: string;
  icon: string;
  reason: string;
  priority: 'must-have' | 'recommended' | 'optional';
}

export interface PackingList {
  essentials: PackingItem[];
  clothing: PackingItem[];
  accessories: PackingItem[];
  documents: PackingItem[];
  healthKit: PackingItem[];
  extras: PackingItem[];
}

export interface UpcomingStop {
  station: string;
  stationCode: string;
  scheduledArrival: string;
  expectedArrival: string;
  scheduledDeparture: string;
  platform?: number;
  haltTime?: string;
  distanceFromSource?: number;
  arrived: boolean;
}

export interface TrainLiveStatus {
  trainNumber: string;
  trainName: string;
  currentStation: string;
  delay: number;
  lastUpdated: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'not-started' | 'unavailable';
  upcomingStops: UpcomingStop[];
  source: 'api' | 'fallback';
}

export interface Review {
  _id: string;
  userId: string;
  userName: string;
  placeId: string;
  placeName: string;
  cityName: string;
  rating: number;
  title: string;
  comment: string;
  visitDate?: string;
  photos?: string[];
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// AI Trip Suggestion types
export interface TripSuggestion {
  title: string;
  description: string;
  stateCode: string;
  cityIds: string[];
  duration: number;
  budget: BudgetTier;
  highlights: string[];
  imageUrl: string;
  tags: string[];
}

export interface ParsedTripQuery {
  tripRequest: Partial<TripRequest>;
  confidence: Record<string, number>;
  suggestions: TripSuggestion[];
  detectedEntities: {
    duration?: string;
    budget?: string;
    style?: string;
    locations: string[];
    constraints: string[];
    interests: string[];
  };
}

export interface Festival {
  _id: string;
  name: string;
  cityName: string;
  stateCode: string;
  month: number;
  approximateDate?: string;
  duration: number;
  type: 'religious' | 'cultural' | 'fair' | 'music' | 'food' | 'art';
  description: string;
  highlights: string[];
  impact: 'must-see' | 'worth-attending' | 'background';
  crowdLevel: 'extreme' | 'high' | 'moderate' | 'low';
  travelAdvisory?: string;
  imageUrl?: string;
}

export interface EmergencyInfo {
  cityName: string;
  police: { number: string; station: string; address: string };
  hospital: { name: string; number: string; address: string; hasEmergency: boolean }[];
  touristHelpline: string;
  womenHelpline: string;
  ambulance: string;
  fire: string;
  nearestAirport: { name: string; code: string; distanceKm: number };
  embassy?: { country: string; phone: string; address: string }[];
  localTips: string[];
  scamWarnings: string[];
  safeAreas: string[];
  areasToAvoidAtNight: string[];
}

export interface BookingLink {
  provider: string;
  url: string;
  logo: string;
  mode: string;
  estimatedPrice?: { min: number; max: number };
}

export interface Expense {
  _id: string;
  userId: string;
  tripId: string;
  category: 'stay' | 'transport' | 'food' | 'activities' | 'shopping' | 'tips' | 'other';
  amount: number;
  description: string;
  day: number;
  city?: string;
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  receipt?: string;
  createdAt: string;
}

export interface ExpenseSummary {
  estimated: { stay: number; transport: number; activities: number; food: number };
  actual: Record<string, number>;
  difference: Record<string, number>;
  totalEstimated: number;
  totalActual: number;
  percentUsed: number;
  dailySpending: Record<number, number>;
  expenseCount: number;
}

export interface GroupMember {
  _id: string;
  userId?: string;
  email: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'invited' | 'accepted' | 'declined';
  invitedAt: string;
  respondedAt?: string;
}

export interface GroupChat {
  _id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface GroupPollOption {
  _id: string;
  text: string;
  votes: string[];
}

export interface GroupPoll {
  _id: string;
  question: string;
  options: GroupPollOption[];
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface TripGroup {
  _id: string;
  tripId: string | SavedTrip;
  ownerId: string;
  name: string;
  members: GroupMember[];
  chat: GroupChat[];
  polls: GroupPoll[];
  maxMembers: number;
  createdAt: string;
}

export interface PublicTripCreator {
  _id: string;
  name: string;
  memberSince: string;
}

export interface PublicTrip {
  _id: string;
  title: string;
  tripRequest: {
    stateCode?: string;
    stateCodes?: string[];
    duration?: number;
    budget?: BudgetTier;
    travelStyle?: TravelStyle;
  };
  tripResult: {
    itinerary: { day: number; city: string; activities: { name: string; type: string }[] }[];
    summary: TripResult['summary'];
  };
  likes: number;
  tags: string[];
  coverImage?: string;
  isPublic: boolean;
  creator: PublicTripCreator | null;
  createdAt: string;
}

export interface TrendingDestination {
  city: string;
  tripCount: number;
  totalLikes: number;
}

export interface UserPublicProfile {
  _id: string;
  name: string;
  memberSince: string;
  tripCount: number;
  reviewCount: number;
  totalLikes: number;
}

export type NotificationType = 'trip_reminder' | 'weather_alert' | 'price_change' | 'review_prompt' | 'festival_alert' | 'system';

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export type JournalMood = 'amazing' | 'happy' | 'neutral' | 'tired' | 'challenging';

export interface JournalEntry {
  _id: string;
  userId: string;
  tripId: string;
  day: number;
  city: string;
  title: string;
  content: string;
  mood: JournalMood;
  photos: string[];
  placeName?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsActivity {
  _id: string;
  type: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  searchQuery?: string;
}
