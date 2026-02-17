import { FC, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TripWizard, ItineraryView, Map, TripSidebar, PackagesSection, TripComparison, SmartSearch } from '@/components/planner';
import { TripRequest, TripResult } from '@/types';
import { useTripStore } from '@/stores/tripStore';
import { getConfig, generateTrip, generateTripVariants } from '@/services/api';
import ThemeToggle from '@/components/common/ThemeToggle';

export const Planner: FC = () => {
  const [config, setConfig] = useState<{ states: any[], cities: any[] }>({ states: [], cities: [] });
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'wizard' | 'trip' | 'itinerary' | 'packages' | 'compare' | 'smart'>('trip');
  const [activeDay, setActiveDay] = useState<number | null>(null);

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
        // Default to first state (Rajasthan for now)
        if (data.states.length > 0) setSelectedState(data.states[0]);
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
    try {
      const result = await generateTrip(req);
      setTripResult(result);
      setActiveTab('itinerary');
    } catch (e) {
      console.error(e);
      alert('Failed to generate trip. Please try again.');
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
      alert('Failed to compare trips. Please try again.');
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
      case 'packages':
        return <PackagesSection />;
      case 'itinerary':
        return tripResult ? (
          <ItineraryView result={tripResult} onReset={() => setTripResult(null)} activeDay={activeDay} onDaySelect={setActiveDay} startDate={tripStartDate} />
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
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Left Sidebar */}
      <div className="hidden md:flex flex-col w-[420px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">TripPlanner</span>
          </Link>
          <ThemeToggle />
        </div>

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
            onClick={() => setActiveTab('packages')}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === 'packages' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Packages
            {activeTab === 'packages' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
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
          {renderSidebar()}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full w-full">
        {selectedState ? (
          <Map
            center={[selectedState.center.lat, selectedState.center.lng]}
            zoom={selectedState.zoom}
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
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p>Loading Map...</p>
            </div>
          </div>
        )}

        {/* Mobile Bottom Sheet Toggle */}
        <div className="absolute bottom-6 right-6 md:hidden z-[1000] flex gap-2">
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
