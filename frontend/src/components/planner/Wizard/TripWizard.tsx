import { FC, useState, useMemo } from 'react';
import { TripRequest } from '@/types';
import { Calendar, CheckCircle, Clock, DollarSign, MapPin, Sparkles, Sun, Users, Snowflake, CloudRain, Leaf, Package, Crown, Backpack, Compass, Heart, Zap, Globe } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface TripWizardProps {
  cities: any[];
  states?: any[];
  onGenerate: (data: TripRequest) => void;
  onCompare?: (data: TripRequest) => void;
  selectedCityIds: string[];
  onCityToggle: (id: string) => void;
  isLoading: boolean;
  isComparing?: boolean;
}

// Season types with relevant metadata
type Season = 'winter' | 'summer' | 'monsoon' | 'spring';

interface SuggestedPlan {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlights: string[];
  recommendedDuration: { min: number; max: number };
  idealFor: string[];
  budget: 'budget' | 'standard' | 'premium';
  style: 'relaxed' | 'fast';
  recommendedCityNames: string[]; // Cities to auto-select for this package
}

// Helper function to determine season from date
const getSeason = (date: Date): Season => {
  const month = date.getMonth() + 1;
  if (month >= 11 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'summer';
  if (month >= 6 && month <= 9) return 'monsoon';
  return 'spring';
};

// Get season display info
const getSeasonInfo = (season: Season) => {
  const seasonMap = {
    winter: { name: 'Winter', icon: <Snowflake className="text-blue-400" size={20} />, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    summer: { name: 'Summer', icon: <Sun className="text-orange-400" size={20} />, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    monsoon: { name: 'Monsoon', icon: <CloudRain className="text-teal-400" size={20} />, color: 'bg-teal-50 border-teal-200 text-teal-700' },
    spring: { name: 'Spring', icon: <Leaf className="text-green-400" size={20} />, color: 'bg-green-50 border-green-200 text-green-700' }
  };
  return seasonMap[season];
};

// Suggested plans based on season and duration
const getSeasonalPlans = (season: Season, duration: number): SuggestedPlan[] => {
  const allPlans: Record<Season, SuggestedPlan[]> = {
    winter: [
      {
        id: 'desert-festival',
        title: 'Desert Festival Explorer',
        description: 'Experience the vibrant desert festivals, camel safaris, and cool desert nights.',
        icon: <Sparkles className="text-amber-500" size={24} />,
        highlights: ['Desert Safari', 'Jaisalmer Fort', 'Pushkar Fair', 'Cultural Performances'],
        recommendedDuration: { min: 5, max: 10 },
        idealFor: ['Couples', 'Photographers', 'Culture Enthusiasts'],
        budget: 'standard',
        style: 'relaxed',
        recommendedCityNames: ['Jaisalmer', 'Bikaner', 'Jodhpur', 'Pushkar']
      },
      {
        id: 'royal-heritage',
        title: 'Royal Heritage Trail',
        description: 'Explore majestic palaces and forts in pleasant winter weather.',
        icon: <Sparkles className="text-purple-500" size={24} />,
        highlights: ['Udaipur Palaces', 'Jaipur Forts', 'Jodhpur Blue City', 'Heritage Walks'],
        recommendedDuration: { min: 7, max: 14 },
        idealFor: ['Families', 'History Buffs', 'Luxury Travelers'],
        budget: 'premium',
        style: 'relaxed',
        recommendedCityNames: ['Udaipur', 'Jaipur', 'Jodhpur', 'Jaisalmer']
      }
    ],
    summer: [
      {
        id: 'hill-station',
        title: 'Hill Station Retreat',
        description: 'Escape the heat with Mount Abu and nearby hill retreats.',
        icon: <Sparkles className="text-green-500" size={24} />,
        highlights: ['Mount Abu', 'Dilwara Temples', 'Nakki Lake', 'Wildlife Sanctuaries'],
        recommendedDuration: { min: 3, max: 7 },
        idealFor: ['Families', 'Nature Lovers', 'Senior Citizens'],
        budget: 'standard',
        style: 'relaxed',
        recommendedCityNames: ['Mount Abu', 'Udaipur']
      },
      {
        id: 'early-morning',
        title: 'Early Bird Explorer',
        description: 'Beat the heat with early morning sightseeing and afternoon relaxation.',
        icon: <Sparkles className="text-amber-500" size={24} />,
        highlights: ['Sunrise Views', 'Air-conditioned Museums', 'Pool Side Evenings', 'Night Markets'],
        recommendedDuration: { min: 4, max: 8 },
        idealFor: ['Couples', 'Young Travelers', 'Budget Conscious'],
        budget: 'budget',
        style: 'fast',
        recommendedCityNames: ['Jaipur', 'Jodhpur', 'Udaipur']
      }
    ],
    monsoon: [
      {
        id: 'monsoon-magic',
        title: 'Monsoon Magic Journey',
        description: 'Experience lush green landscapes and dramatic monsoon skies.',
        icon: <Sparkles className="text-teal-500" size={24} />,
        highlights: ['Ranthambore Green', 'Waterfalls', 'Palace Hotels', 'Romantic Getaways'],
        recommendedDuration: { min: 4, max: 7 },
        idealFor: ['Couples', 'Photographers', 'Adventure Seekers'],
        budget: 'standard',
        style: 'relaxed',
        recommendedCityNames: ['Udaipur', 'Mount Abu', 'Ranthambore']
      },
      {
        id: 'indoor-heritage',
        title: 'Indoor Heritage Tour',
        description: 'Focus on museums, indoor attractions, and culinary experiences.',
        icon: <Sparkles className="text-indigo-500" size={24} />,
        highlights: ['Museums', 'Cooking Classes', 'Shopping Bazaars', 'Spa & Wellness'],
        recommendedDuration: { min: 3, max: 6 },
        idealFor: ['Families', 'Culture Enthusiasts', 'Food Lovers'],
        budget: 'premium',
        style: 'relaxed',
        recommendedCityNames: ['Jaipur', 'Udaipur', 'Jodhpur']
      }
    ],
    spring: [
      {
        id: 'holi-festival',
        title: 'Holi Festival Special',
        description: 'Celebrate the festival of colors in its most authentic form.',
        icon: <Sparkles className="text-pink-500" size={24} />,
        highlights: ['Holi Celebrations', 'Temple Visits', 'Local Festivities', 'Traditional Cuisine'],
        recommendedDuration: { min: 4, max: 8 },
        idealFor: ['Couples', 'Culture Enthusiasts', 'Young Travelers'],
        budget: 'standard',
        style: 'fast',
        recommendedCityNames: ['Pushkar', 'Jaipur', 'Udaipur', 'Mathura']
      },
      {
        id: 'complete-rajasthan',
        title: 'Complete Rajasthan',
        description: 'Perfect weather to cover maximum destinations comfortably.',
        icon: <Sparkles className="text-emerald-500" size={24} />,
        highlights: ['All Major Cities', 'Mixed Experiences', 'Flexible Itinerary', 'Best Weather'],
        recommendedDuration: { min: 10, max: 15 },
        idealFor: ['First-timers', 'Families', 'Group Tours'],
        budget: 'standard',
        style: 'relaxed',
        recommendedCityNames: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer', 'Pushkar', 'Bikaner']
      }
    ]
  };

  return allPlans[season].filter(plan =>
    duration >= plan.recommendedDuration.min - 2 && duration <= plan.recommendedDuration.max + 3
  );
};

export const TripWizard: FC<TripWizardProps> = ({ cities, states = [], onGenerate, onCompare, selectedCityIds, onCityToggle, isLoading, isComparing }) => {
  const [step, setStep] = useState(1);

  // State selection
  const [selectedStateCodes, setSelectedStateCodes] = useState<string[]>([]);

  const toggleState = (code: string) => {
    setSelectedStateCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Filter cities by selected states (map state code -> stateCode pattern)
  const stateCodeToName: Record<string, string> = {
    RJ: 'RAJASTHAN', KL: 'KERALA', GA: 'GOA', MH: 'MAHARASHTRA',
    TN: 'TAMIL_NADU', WB: 'WEST_BENGAL', KA: 'KARNATAKA', GJ: 'GUJARAT',
    HP: 'HIMACHAL_PRADESH', UP: 'UTTAR_PRADESH', MP: 'MADHYA_PRADESH'
  };

  const filteredCities = useMemo(() => {
    if (selectedStateCodes.length === 0) return cities;
    const stateNames = selectedStateCodes.map(c => stateCodeToName[c]).filter(Boolean);
    return cities.filter((city: any) => stateNames.includes(city.stateCode));
  }, [cities, selectedStateCodes]);

  // Date selection state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<TripRequest>>({
    duration: 5,
    budget: 'standard',
    travelStyle: 'relaxed',
    constraints: {
      maxTravelHoursPerDay: 6,
      seniorFriendly: false,
      morningReligious: false,
      noNightTravel: true
    }
  });

  // Calculate duration and season from dates
  const { calculatedDuration, season, seasonInfo, suggestedPlans } = useMemo(() => {
    if (!startDate || !endDate) {
      return { calculatedDuration: 0, season: null, seasonInfo: null, suggestedPlans: [] };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const currentSeason = getSeason(start);
    const info = getSeasonInfo(currentSeason);
    const plans = getSeasonalPlans(currentSeason, diffDays);

    return {
      calculatedDuration: diffDays,
      season: currentSeason,
      seasonInfo: info,
      suggestedPlans: plans
    };
  }, [startDate, endDate]);

  // Calculate package type based on preferences
  const packageType = useMemo(() => {
    const duration = formData.duration || 5;
    const budget = formData.budget || 'standard';
    const style = formData.travelStyle || 'relaxed';
    const seniorFriendly = formData.constraints?.seniorFriendly || false;
    const morningReligious = formData.constraints?.morningReligious || false;

    // Package type logic based on preferences
    if (budget === 'premium' && style === 'relaxed') {
      return {
        name: 'Luxury Voyager',
        icon: <Crown className="text-amber-500" size={28} />,
        description: 'Premium experiences with the finest accommodations and exclusive access.',
        color: 'from-amber-500/20 to-yellow-500/20 border-amber-300',
        features: ['5-Star Hotels', 'Private Tours', 'Fine Dining', 'VIP Access'],
        priceRange: '₹15,000 - ₹25,000/day',
        recommendedTiers: ['tier1'],
        recommendedCities: ['Udaipur', 'Jaipur', 'Jodhpur'],
        cityReason: 'Premium heritage hotels and palace stays'
      };
    }

    if (budget === 'premium' && style === 'fast') {
      return {
        name: 'Elite Express',
        icon: <Zap className="text-purple-500" size={28} />,
        description: 'Maximum coverage with premium comfort and efficiency.',
        color: 'from-purple-500/20 to-pink-500/20 border-purple-300',
        features: ['Premium Transport', 'Quick Check-ins', 'Curated Highlights', 'Concierge Service'],
        priceRange: '₹12,000 - ₹20,000/day',
        recommendedTiers: ['tier1', 'tier2'],
        recommendedCities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer'],
        cityReason: 'Well-connected cities with major attractions'
      };
    }

    if (budget === 'budget' && style === 'fast') {
      return {
        name: 'Backpacker',
        icon: <Backpack className="text-green-500" size={28} />,
        description: 'Adventure-packed journey with smart budget choices.',
        color: 'from-green-500/20 to-emerald-500/20 border-green-300',
        features: ['Hostels & Guesthouses', 'Local Transport', 'Street Food Tours', 'Group Activities'],
        priceRange: '₹2,000 - ₹4,000/day',
        recommendedTiers: ['tier2', 'tier3'],
        recommendedCities: ['Pushkar', 'Bundi', 'Bikaner', 'Ajmer'],
        cityReason: 'Budget-friendly with authentic experiences'
      };
    }

    if (budget === 'budget' && style === 'relaxed') {
      return {
        name: 'Budget Explorer',
        icon: <Compass className="text-teal-500" size={28} />,
        description: 'Discover hidden gems without breaking the bank.',
        color: 'from-teal-500/20 to-cyan-500/20 border-teal-300',
        features: ['Budget Hotels', 'Public Transport', 'Local Experiences', 'Authentic Cuisine'],
        priceRange: '₹2,500 - ₹5,000/day',
        recommendedTiers: ['tier2', 'tier3'],
        recommendedCities: ['Pushkar', 'Bundi', 'Chittorgarh', 'Mount Abu'],
        cityReason: 'Offbeat locations with lower costs'
      };
    }

    if (seniorFriendly || morningReligious) {
      return {
        name: 'Heritage Enthusiast',
        icon: <Heart className="text-rose-500" size={28} />,
        description: 'Thoughtfully designed for comfort and cultural immersion.',
        color: 'from-rose-500/20 to-pink-500/20 border-rose-300',
        features: ['Accessible Routes', 'Temple Visits', 'Cultural Programs', 'Comfortable Pace'],
        priceRange: '₹6,000 - ₹10,000/day',
        recommendedTiers: ['tier1', 'tier2'],
        recommendedCities: ['Pushkar', 'Udaipur', 'Jaipur', 'Nathdwara'],
        cityReason: 'Sacred sites and accessible destinations'
      };
    }

    if (duration >= 10) {
      return {
        name: 'Grand Explorer',
        icon: <Compass className="text-indigo-500" size={28} />,
        description: 'Comprehensive journey covering all major destinations.',
        color: 'from-indigo-500/20 to-blue-500/20 border-indigo-300',
        features: ['Complete Coverage', 'Mixed Experiences', 'Multi-City Tours', 'Balanced Itinerary'],
        priceRange: '₹5,000 - ₹8,000/day',
        recommendedTiers: ['tier1', 'tier2', 'tier3'],
        recommendedCities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Jaisalmer', 'Pushkar'],
        cityReason: 'Complete Rajasthan coverage'
      };
    }

    // Default: Comfort Seeker (standard budget, relaxed style)
    return {
      name: 'Comfort Seeker',
      icon: <Package className="text-blue-500" size={28} />,
      description: 'Balanced experience with quality stays and curated activities.',
      color: 'from-blue-500/20 to-sky-500/20 border-blue-300',
      features: ['3-4 Star Hotels', 'AC Transport', 'Guided Tours', 'Quality Restaurants'],
      priceRange: '₹5,000 - ₹8,000/day',
      recommendedTiers: ['tier1', 'tier2'],
      recommendedCities: ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer'],
      cityReason: 'Popular destinations with good infrastructure'
    };
  }, [formData.duration, formData.budget, formData.travelStyle, formData.constraints?.seniorFriendly, formData.constraints?.morningReligious]);

  // Sort cities: recommended cities first, then by tier match
  const sortedCities = useMemo(() => {
    if (!filteredCities || filteredCities.length === 0) return [];

    return [...filteredCities].sort((a, b) => {
      const aRecommended = packageType.recommendedCities?.includes(a.name) ? 1 : 0;
      const bRecommended = packageType.recommendedCities?.includes(b.name) ? 1 : 0;

      if (aRecommended !== bRecommended) return bRecommended - aRecommended;

      const aTierMatch = packageType.recommendedTiers?.includes(a.tier) ? 1 : 0;
      const bTierMatch = packageType.recommendedTiers?.includes(b.tier) ? 1 : 0;

      return bTierMatch - aTierMatch;
    });
  }, [cities, packageType]);

  // Update form data when plan is selected and auto-select recommended cities
  const handlePlanSelect = (plan: SuggestedPlan) => {
    setSelectedPlan(plan.id);

    // Auto-select recommended cities for this package
    if (plan.recommendedCityNames && plan.recommendedCityNames.length > 0) {
      const cityIdsToSelect = cities
        .filter(city => plan.recommendedCityNames.includes(city.name))
        .map(city => city._id);

      // Toggle on cities that aren't already selected
      cityIdsToSelect.forEach(id => {
        if (!selectedCityIds.includes(id)) {
          onCityToggle(id);
        }
      });
    }

    setFormData({
      ...formData,
      duration: calculatedDuration,
      budget: plan.budget,
      travelStyle: plan.style
    });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (compare: boolean = false) => {
    if (formData.duration && formData.budget && formData.travelStyle && formData.constraints) {
      const req: TripRequest = {
        stateCode: selectedStateCodes[0] || 'RJ',
        stateCodes: selectedStateCodes.length > 0 ? selectedStateCodes : ['RJ'],
        selectedCityIds,
        duration: formData.duration,
        budget: formData.budget as any,
        travelStyle: formData.travelStyle as any,
        constraints: formData.constraints
      };
      if (compare && onCompare) {
        onCompare(req);
      } else {
        onGenerate(req);
      }
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const isDateStepValid = startDate && endDate && calculatedDuration > 0;

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-8 shadow-2xl rounded-2xl max-w-md w-full h-full max-h-full overflow-y-auto border border-white/50 dark:border-slate-700/50">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text dark:text-white font-serif">Plan Your Journey</h2>
        <div className="flex space-x-2 mt-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={clsx("h-1.5 flex-1 rounded-full transition-all duration-300", i <= step ? "bg-accent" : "bg-gray-200 dark:bg-slate-600")} />
          ))}
        </div>
      </div>

      {/* Step 1: State Selection */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <Globe size={24} /> Choose States
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select one or more states to plan a multi-state journey. Skip this step to see all destinations.</p>

          <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {states.map((st: any) => (
              <div
                key={st.code}
                className={clsx(
                  'p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 text-center group',
                  selectedStateCodes.includes(st.code)
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 dark:border-slate-600 hover:border-primary/40 hover:shadow-sm'
                )}
                onClick={() => toggleState(st.code)}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden mx-auto mb-2 shadow-sm">
                  <img
                    src={st.imageUrl || `https://source.unsplash.com/80x80/?${st.name},india`}
                    alt={st.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className={clsx('font-bold text-sm', selectedStateCodes.includes(st.code) ? 'text-primary' : 'text-gray-700 dark:text-gray-300')}>
                  {st.name}
                </span>
                {selectedStateCodes.includes(st.code) && (
                  <CheckCircle size={16} className="text-accent mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>

          {selectedStateCodes.length > 1 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-3 rounded-xl text-sm text-amber-800 dark:text-amber-300">
              🚆 Multi-state trip! Inter-state travel by train/flight will be included.
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 transition-all transform hover:-translate-y-0.5"
          >
            {selectedStateCodes.length === 0 ? 'Skip — Show All Destinations' : `Next: Travel Dates (${selectedStateCodes.length} state${selectedStateCodes.length > 1 ? 's' : ''})`}
          </button>
        </motion.div>
      )}

      {/* Step 2: Date Selection */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <Calendar size={24} /> When do you want to travel?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select your travel dates to get personalized recommendations based on season and duration.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                min={today}
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate('');
                  }
                }}
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={!startDate}
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Show calculated info */}
          {isDateStepValid && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-xl border border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">{calculatedDuration} Days Trip</span>
                </div>
                {seasonInfo && (
                  <div className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium", seasonInfo.color)}>
                    {seasonInfo.icon}
                    {seasonInfo.name} Season
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {season === 'winter' && '❄️ Perfect weather for desert exploration and outdoor activities!'}
                {season === 'summer' && '☀️ Consider hill stations and early morning sightseeing.'}
                {season === 'monsoon' && '🌧️ Lush green landscapes await! Pack rain gear.'}
                {season === 'spring' && '🌸 Ideal weather for comprehensive Rajasthan exploration!'}
              </p>
            </motion.div>
          )}

          {/* Suggested Plans */}
          {isDateStepValid && suggestedPlans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                Recommended Plans for You
              </h4>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {suggestedPlans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className={clsx(
                      "p-4 border rounded-xl cursor-pointer transition-all duration-200",
                      selectedPlan === plan.id
                        ? "border-accent bg-accent/5 shadow-md ring-2 ring-accent/30"
                        : "border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                        {plan.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className={clsx("font-bold", selectedPlan === plan.id ? "text-accent" : "text-gray-700 dark:text-gray-300")}>
                            {plan.title}
                          </h5>
                          {selectedPlan === plan.id && <CheckCircle size={18} className="text-accent" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {plan.highlights.slice(0, 3).map((h, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-600 rounded-full text-gray-600 dark:text-gray-300">
                              {h}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="capitalize">💰 {plan.budget}</span>
                          <span className="capitalize">🚶 {plan.style}</span>
                          <span>📅 {plan.recommendedDuration.min}-{plan.recommendedDuration.max} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <button
            disabled={!isDateStepValid}
            onClick={handleNext}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            Next: Select Destinations
          </button>
        </motion.div>
      )}

      {/* Step 3: City Selection */}
      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <MapPin size={24} /> Select Destinations
          </h3>

          {/* Package-based recommendation */}
          <div className={clsx(
            "p-3 rounded-xl border bg-gradient-to-r text-sm",
            packageType.color
          )}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <span className="font-bold text-gray-800 dark:text-gray-200">For {packageType.name}:</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{packageType.cityReason}</p>
          </div>

          {/* Auto-selected notification */}
          {selectedPlan && selectedCityIds.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-emerald-800 font-medium">
                  ✨ Destinations auto-selected based on your package! You can still modify below.
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {sortedCities.map(city => {
              const isRecommended = packageType.recommendedCities?.includes(city.name);
              const isTierMatch = packageType.recommendedTiers?.includes(city.tier);

              return (
                <div
                  key={city._id}
                  className={clsx(
                    "p-3 border rounded-xl cursor-pointer transition-all duration-200 group relative",
                    selectedCityIds.includes(city._id)
                      ? "border-primary bg-primary/5 shadow-md"
                      : isRecommended
                        ? "border-accent/50 bg-accent/5 hover:border-accent hover:shadow-md"
                        : "border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-200"
                  )}
                  onClick={() => onCityToggle(city._id)}
                >
                  {/* Recommended Badge */}
                  {isRecommended && !selectedCityIds.includes(city._id) && (
                    <div className="absolute -top-2 -right-2 bg-accent text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm z-10">
                      ⭐ Recommended
                    </div>
                  )}

                  <div className="flex gap-3 items-center">
                    {/* City Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                      <img
                        src={city.imageUrl || `https://source.unsplash.com/100x100/?${city.name},india,travel`}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://source.unsplash.com/100x100/?india,city,travel`;
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "font-bold text-base truncate",
                          selectedCityIds.includes(city._id) ? "text-primary" : isRecommended ? "text-accent" : "text-gray-700 dark:text-gray-300"
                        )}>
                          {city.name}
                        </span>
                        {isTierMatch && !isRecommended && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 flex-shrink-0">Good match</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {city.description?.substring(0, 45) || 'Beautiful destination'}...
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">📅 {city.idealDays || 2}d</span>
                        {city.tier && (
                          <span className={clsx(
                            "text-xs px-1.5 py-0.5 rounded",
                            city.tier === 'tier1' ? "bg-amber-100 text-amber-700" :
                              city.tier === 'tier2' ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-600"
                          )}>
                            {city.tier === 'tier1' ? '⭐ Premium' : city.tier === 'tier2' ? '✓ Popular' : '🌿 Offbeat'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {selectedCityIds.includes(city._id) && (
                      <CheckCircle size={22} className="text-accent flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selection Summary */}
          {selectedCityIds.length > 0 && (
            <div className="bg-primary/5 p-3 rounded-xl border border-primary/20">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold text-primary">{selectedCityIds.length}</span> destination{selectedCityIds.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button onClick={handleBack} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">Back</button>
            <button
              disabled={selectedCityIds.length === 0}
              onClick={handleNext}
              className="px-8 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              Next: Preferences
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Preferences */}
      {step === 4 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <DollarSign size={24} /> Preferences
          </h3>

          {/* Dynamic Package Type Recommendation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={packageType.name}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={clsx(
                "p-4 rounded-xl border-2 bg-gradient-to-r",
                packageType.color
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {packageType.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-lg">Your Package Type</h4>
                    <span className="text-xs bg-white/80 px-2 py-1 rounded-full font-medium text-gray-600">
                      {packageType.priceRange}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary mt-1">{packageType.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{packageType.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {packageType.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-white/70 rounded-full text-gray-700 font-medium"
                      >
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Show selected plan summary */}
          {selectedPlan && (
            <div className="bg-accent/5 p-3 rounded-xl border border-accent/20 text-sm">
              <span className="text-gray-600">Based on your selected plan: </span>
              <span className="font-bold text-accent">{suggestedPlans.find(p => p.id === selectedPlan)?.title}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Duration (Days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Budget Tier</label>
            <div className="grid grid-cols-3 gap-3">
              {['budget', 'standard', 'premium'].map(b => (
                <button
                  key={b}
                  onClick={() => setFormData({ ...formData, budget: b as any })}
                  className={clsx(
                    "p-3 border rounded-xl capitalize text-sm font-medium transition-all",
                    formData.budget === b ? "bg-primary text-white border-primary shadow-md" : "hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300"
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Travel Pace</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ ...formData, travelStyle: 'relaxed' })}
                className={clsx("p-3 border rounded-xl flex items-center justify-center gap-2 transition-all", formData.travelStyle === 'relaxed' ? "bg-secondary text-text border-secondary shadow-md" : "hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300")}
              >
                <Sun size={18} /> Relaxed
              </button>
              <button
                onClick={() => setFormData({ ...formData, travelStyle: 'fast' })}
                className={clsx("p-3 border rounded-xl flex items-center justify-center gap-2 transition-all", formData.travelStyle === 'fast' ? "bg-accent text-white border-accent shadow-md" : "hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300")}
              >
                <Clock size={18} /> Fast Paced
              </button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={handleBack} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">Back</button>
            <button onClick={handleNext} className="px-8 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all transform hover:-translate-y-0.5">Next</button>
          </div>
        </motion.div>
      )}

      {/* Step 5: Fine Tune */}
      {step === 5 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
            <Users size={24} /> Fine Tune
          </h3>

          <div className="space-y-4">
            <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={formData.constraints?.seniorFriendly}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, seniorFriendly: e.target.checked }
                })}
                className="h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Senior Friendly (Accessible)</span>
            </label>

            <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={formData.constraints?.morningReligious}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, morningReligious: e.target.checked }
                })}
                className="h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">Morning Temple Visits</span>
            </label>

            <label className="flex items-center space-x-4 cursor-pointer p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={formData.constraints?.noNightTravel}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, noNightTravel: e.target.checked }
                })}
                className="h-5 w-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700 dark:text-gray-300 font-medium">No Night Travel (End by 8PM)</span>
            </label>

            <div className="pt-4">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Max Travel Hours / Day</label>
              <input
                type="range"
                min={2}
                max={12}
                value={formData.constraints?.maxTravelHoursPerDay}
                onChange={e => setFormData({
                  ...formData,
                  constraints: { ...formData.constraints!, maxTravelHoursPerDay: parseInt(e.target.value) }
                })}
                className="w-full accent-primary h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-right text-sm font-bold text-primary mt-1">{formData.constraints?.maxTravelHoursPerDay} hours</div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 gap-3">
            <button onClick={handleBack} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Back</button>
            <div className="flex gap-2">
              {onCompare && (
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading || isComparing}
                  className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
                >
                  {isComparing ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Comparing...
                    </>
                  ) : 'Compare Plans'}
                </button>
              )}
              <button
                onClick={() => handleSubmit(false)}
                disabled={isLoading || isComparing}
                className="px-8 py-3 bg-accent text-white rounded-xl font-bold shadow-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Generating...
                  </>
                ) : 'Build My Itinerary'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
