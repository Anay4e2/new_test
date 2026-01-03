import { FC, useState, useEffect, useMemo } from 'react';
import { TripWizard } from '@/components/Wizard/TripWizard';
import { ItineraryView } from '@/components/Itinerary/ItineraryView';
import { Map } from '@/components/Map/Map';
import { TripSidebar } from '@/components/Trip/TripSidebar';
import { TripRequest, TripResult } from '@/lib/types';
import { useTripStore } from '@/stores/tripStore';
import axios from 'axios';

export const Planner: FC = () => {
  const [config, setConfig] = useState<{ states: any[], cities: any[] }>({ states: [], cities: [] });
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'wizard' | 'trip' | 'itinerary'>('trip');

  // Trip store for selected places count
  const { selectedPlaces } = useTripStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/config');
        setConfig(res.data);
        // Default to first state (Rajasthan for now)
        if (res.data.states.length > 0) setSelectedState(res.data.states[0]);
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
      const res = await axios.post('/api/generate-trip', req);
      setTripResult(res.data);
      setActiveTab('itinerary');
    } catch (e) {
      console.error(e);
      alert('Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
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
            selectedCityIds={selectedCityIds}
            onCityToggle={handleCityToggle}
            onGenerate={handleGenerate}
            isLoading={loading}
          />
        );
      case 'trip':
        return <TripSidebar />;
      case 'itinerary':
        return tripResult ? (
          <ItineraryView result={tripResult} onReset={() => setTripResult(null)} />
        ) : (
          <TripSidebar />
        );
      default:
        return <TripSidebar />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-neutral overflow-hidden">
      {/* Left Sidebar */}
      <div className="hidden md:flex flex-col w-[420px] border-r border-white/10">
        {/* Tab Switcher */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('trip')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'trip' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            My Trip
            {selectedPlaces.length > 0 && (
              <span className="absolute top-1 right-4 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {selectedPlaces.length}
              </span>
            )}
            {activeTab === 'trip' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>
          <button
            onClick={() => setActiveTab('wizard')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'wizard' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
          >
            Advanced
            {activeTab === 'wizard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
          </button>
          {tripResult && (
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === 'itinerary' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Itinerary
              {activeTab === 'itinerary' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
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
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Loading Map...</div>
        )}

        {/* Mobile Bottom Sheet Toggle */}
        <div className="absolute bottom-6 right-6 md:hidden z-[1000] flex gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'trip' ? 'wizard' : 'trip')}
            className="bg-white/10 backdrop-blur-lg text-white p-4 rounded-full shadow-xl font-bold border border-white/20"
          >
            {activeTab === 'trip' ? '⚙️' : '🗺️'}
          </button>
          {selectedPlaces.length > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {selectedPlaces.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
