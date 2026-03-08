import { FC, useState, useEffect, useMemo } from 'react';
import { TripWizard, ItineraryView, Map, TripSidebar, TripComparison, SmartSearch, ItinerarySkeleton } from '@/components/planner';
import { TripRequest, TripResult } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import { getConfig, generateTrip, generateTripVariants, getSeasonalWeather } from '@/services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const Planner: FC = () => {
  const [config, setConfig] = useState<{ states: any[], cities: any[] }>({ states: [], cities: [] });
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'wizard' | 'trip' | 'itinerary' | 'compare' | 'smart'>('trip');
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [lastRequest, setLastRequest] = useState<TripRequest | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<TripRequest | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Comparison state
  const [comparisonVariants, setComparisonVariants] = useState<{ label: string; tripResult: TripResult }[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Trip store for selected places count
  const { selectedPlaces, tripStartDate } = useTripStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getConfig();
        setConfig(data);
        // Don't auto-select a state — let the map start with all-India view
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleCityToggle = (id: string) => {
    if (selectedCityIds.includes(id)) {
      setSelectedCityIds(selectedCityIds.filter(c => c !== id));
    } else {
      setSelectedCityIds([...selectedCityIds, id]);
    }
  };

  const handleGenerate = async (req: TripRequest) => {
    setLoading(true);
    setGenerateError(null);
    setLastFailedRequest(null);
    setLastRequest(req);
    try {
      const result = await generateTrip(req);

      // Enrich itinerary days with seasonal weather
      if (result.itinerary?.length) {
        const month = req.startDate ? new Date(req.startDate).getMonth() + 1 : new Date().getMonth() + 1;
        const weatherCache: Record<string, any> = {};
        await Promise.all(
          result.itinerary.map(async (day) => {
            const city = day.city?.toLowerCase();
            if (!city) return;
            if (!weatherCache[city]) {
              try {
                const res = await getSeasonalWeather(city, month);
                if (res.success) weatherCache[city] = res.data;
              } catch { console.warn(`Failed to fetch weather for ${city}`); }
            }
            if (weatherCache[city]) {
              day.weather = weatherCache[city];
            }
          })
        );
      }

      setTripResult(result);
      setActiveTab('itinerary');
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || 'Failed to generate trip.';
      setGenerateError(msg);
      setLastFailedRequest(req);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (req: TripRequest) => {
    setIsComparing(true);
    try {
      const result = await generateTripVariants(req);
      setComparisonVariants(result.variants);
      setActiveTab('compare');
    } catch (e) {
      console.error(e);
      toast.error('Failed to compare trips. Please try again.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleSelectVariant = (index: number) => {
    const selected = comparisonVariants[index];
    if (selected) {
      setTripResult(selected.tripResult);
      setActiveTab('itinerary');
    }
  };

  // Generate route coordinates for the map if result exists
  const routeCoordinates: Array<[number, number]> | undefined = useMemo(() => {
    if (!tripResult) return undefined;
    if (!tripResult.itinerary || tripResult.itinerary.length === 0) return undefined;

    // Extract sequence of cities from itinerary
    const route: Array<[number, number]> = [];

    // Add start (guard against missing config/city data)
    const firstDay = tripResult.itinerary[0];
    if (firstDay && firstDay.city) {
      const startCity = config.cities.find((c: any) => c.name === firstDay.city);
      if (startCity && startCity.coordinates) route.push([startCity.coordinates.lat, startCity.coordinates.lng]);
    }

    tripResult.itinerary.forEach(day => {
      if (day.travel) {
        const toCity = config.cities.find((c: any) => c.name === day.travel!.to);
        if (toCity && toCity.coordinates) route.push([toCity.coordinates.lat, toCity.coordinates.lng]);
      }
    });

    return route;
  }, [tripResult, config.cities]);

  // Render sidebar content based on active tab
  const renderSidebar = () => {
    switch (activeTab) {
      case 'wizard':
        return (
          <TripWizard
            cities={config.cities}
            states={config.states}
            selectedCityIds={selectedCityIds}
            onCityToggle={handleCityToggle}
            onGenerate={handleGenerate}
            onCompare={handleCompare}
            isLoading={loading}
            isComparing={isComparing}
          />
        );
      case 'smart':
        return (
          <SmartSearch
            onGenerate={handleGenerate}
            cities={config.cities}
            isLoading={loading}
          />
        );
      case 'trip':
        return <TripSidebar />;

      case 'itinerary':
        return tripResult ? (
          <ItineraryView result={tripResult} request={lastRequest || undefined} onReset={() => setTripResult(null)} activeDay={activeDay} onDaySelect={setActiveDay} startDate={tripStartDate} />
        ) : (
          <TripSidebar />
        );
      case 'compare':
        return (
          <TripComparison
            variants={comparisonVariants}
            onSelect={handleSelectVariant}
            isLoading={isComparing}
          />
        );
      default:
        return <TripSidebar />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Left Sidebar */}
      <div className="hidden md:flex flex-col w-[340px] lg:w-[420px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('trip')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === 'trip' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            My Trip
            {selectedPlaces.length > 0 && (
              <span className="absolute top-2 right-4 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {selectedPlaces.length}
              </span>
            )}
            {activeTab === 'trip' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === 'wizard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Advanced
            {activeTab === 'wizard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
          <button
            onClick={() => setActiveTab('smart')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === 'smart' ? 'text-violet-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            ✨ Smart
            {activeTab === 'smart' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
          </button>
          {tripResult && (
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === 'itinerary' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Itinerary
              {activeTab === 'itinerary' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          )}
          {comparisonVariants.length > 0 && (
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === 'compare' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Compare
              {activeTab === 'compare' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          {generateError && lastFailedRequest && !loading && (
            <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Trip generation failed</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">{generateError}</p>
                </div>
                <button
                  onClick={() => handleGenerate(lastFailedRequest)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors flex-shrink-0"
                >
                  <RefreshCw size={14} />
                  Retry
                </button>
              </div>
            </div>
          )}
          {renderSidebar()}
          {loading && <ItinerarySkeleton />}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full w-full">
        <Map
          center={selectedState ? [selectedState.center.lat, selectedState.center.lng] : [22.5, 78.9]}
          zoom={selectedState ? selectedState.zoom : 5}
          onStateClick={(stateName) => {
            const state = config.states.find((s: any) => s.name === stateName);
            if (state) setSelectedState(state);
          }}
          route={routeCoordinates}
          itinerary={tripResult?.itinerary}
          cities={config.cities}
          activeDay={activeDay}
          onDaySelect={setActiveDay}
        />

        {/* Mobile Bottom Sheet Toggle */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:hidden z-[1000] flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'trip' ? 'wizard' : 'trip')}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 p-4 rounded-full shadow-lg font-bold border border-slate-200 dark:border-slate-600"
          >
            {activeTab === 'trip' ? '⚙️' : '🗺️'}
          </button>
          {selectedPlaces.length > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {selectedPlaces.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
