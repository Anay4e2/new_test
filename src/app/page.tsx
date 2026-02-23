'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import TripWizard from '@/components/Wizard/TripWizard';
import ItineraryView from '@/components/Itinerary/ItineraryView';
import { TripRequest, TripResult, PlaceData } from '@/lib/planner';

interface StateData {
  _id: string;
  code: string;
  name: string;
  center: { lat: number; lng: number };
  zoom: number;
  description: string;
}

interface CityData {
  _id: string;
  name: string;
  stateCode: string;
  coordinates: { lat: number; lng: number };
  tier: string;
  description: string;
  idealDays: number;
}

interface RouteData {
  fromCity: string;
  toCity: string;
  distance: number;
  duration: number;
  mode: string;
}

// Dynamic import for Leaflet map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

export default function Home() {
  const [config, setConfig] = useState<{ states: StateData[], cities: CityData[] }>({ states: [], cities: [] });
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [routesData, setRoutesData] = useState<RouteData[]>([]);
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'itinerary'>('map');
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [placesError, setPlacesError] = useState(false);

  useEffect(() => {
    setConfigLoading(true);
    fetch('/api/config')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load configuration');
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setConfigError(null);
      })
      .catch(err => {
        console.error('Error fetching config:', err);
        setConfigError('Failed to load trip data. Please refresh the page.');
      })
      .finally(() => setConfigLoading(false));

    fetch('/api/places')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load places');
        return res.json();
      })
      .then(data => setPlaces(data))
      .catch(err => { console.error('Error fetching places:', err); setPlacesError(true); });
  }, []);

  const handleCityToggle = (id: string) => {
    if (selectedCityIds.includes(id)) {
      setSelectedCityIds(selectedCityIds.filter(c => c !== id));
    } else {
      setSelectedCityIds([...selectedCityIds, id]);
    }
  };

  const handleMarkerClick = (id: string) => {
    // Check if this is a city marker
    const city = config.cities.find(c => c._id === id);
    if (city) {
      handleCityToggle(id);
      return;
    }
    // If it's a place marker, select the parent city instead
    const place = places.find(p => p._id === id);
    if (place) {
      const parentCity = config.cities.find(c => c.name === place.cityName);
      if (parentCity) {
        handleCityToggle(parentCity._id);
      }
    }
  };

  const handleStateSelect = (stateName: string) => {
    console.log('Selected State:', stateName);
    const state = config.states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
    if (state) {
      setSelectedState(state);
    } else {
      console.warn('State not found in config:', stateName);
    }
  };

  const handleGenerate = async (req: TripRequest) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTripResult(data);
      setTripError(null);
      setActiveTab('itinerary'); // Switch to itinerary view on mobile automatically
    } catch (e) {
      console.error(e);
      setTripError('Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch routes for map
    fetch('/api/routes')
      .then(res => res.json())
      .then(data => {
        setRoutesData(data);
      })
      .catch(err => console.error('Error fetching routes:', err));
  }, []);

  // Prepare intercity routes for map
  const intercityRoutes = useMemo(() => {
    if (!routesData.length || !config.cities.length) return [];

    return routesData.map(route => {
      const fromCity = config.cities.find(c => c.name === route.fromCity);
      const toCity = config.cities.find(c => c.name === route.toCity);

      if (fromCity && toCity) {
        return {
          from: [fromCity.coordinates.lat, fromCity.coordinates.lng] as [number, number],
          to: [toCity.coordinates.lat, toCity.coordinates.lng] as [number, number],
          color: 'green'
        };
      }
      return null;
    }).filter(Boolean) as Array<{ from: [number, number], to: [number, number], color: string }>;
  }, [routesData, config.cities]);

  // Prepare markers for map - include both cities and places
  const mapMarkers = useMemo(() => {
    if (!selectedState) return []; // Don't show markers if no state is selected

    const filteredCities = config.cities.filter(c => c.stateCode === selectedState.code);

    // Filter places that belong to the filtered cities
    // Note: This assumes we can filter places by some property or just show all places in those cities.
    // Since place.cityName matches city.name, we can use that.
    const cityNames = filteredCities.map(c => c.name);
    const filteredPlaces = places.filter(p => cityNames.includes(p.cityName));

    const cityMarkers = filteredCities.map(c => ({
      id: c._id,
      lat: c.coordinates.lat,
      lng: c.coordinates.lng,
      title: c.name,
      description: `Ideal Days: ${c.idealDays} | Tier: ${c.tier}`
    }));

    const placeMarkers = filteredPlaces.map(p => ({
      id: p._id,
      lat: p.coordinates.lat,
      lng: p.coordinates.lng,
      title: p.name,
      description: p.description || `${p.type} in ${p.cityName}`,
      visitDuration: `${p.timeRequired}h`,
      bestTime: p.bestTimeOfDay,
      entryFee: p.priceTier
    }));

    return [...cityMarkers, ...placeMarkers];
  }, [config.cities, places, selectedState]);

  // Generate route coordinates for the map if result exists
  const routeCoordinates: Array<[number, number]> | undefined = useMemo(() => {
    if (!tripResult || tripResult.itinerary.length === 0) return undefined;

    // Extract sequence of cities from itinerary
    const route: Array<[number, number]> = [];

    // Add start
    const startCity = config.cities.find(c => c.name === tripResult.itinerary[0].city);
    if (startCity) route.push([startCity.coordinates.lat, startCity.coordinates.lng]);

    tripResult.itinerary.forEach(day => {
      if (day.travel) {
        const toCity = config.cities.find(c => c.name === day.travel!.to);
        if (toCity) route.push([toCity.coordinates.lat, toCity.coordinates.lng]);
      }
    });

    return route;
  }, [tripResult, config.cities]);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
      {/* Sidebar / Overlay Panel */}
      <div className={`absolute md:relative z-20 top-0 left-0 h-full w-full md:w-[450px] transition-transform duration-300 ${activeTab === 'map' ? 'translate-x-full md:translate-x-0' : 'translate-x-0'} md:translate-x-0 flex flex-col`}>
        {configLoading ? (
          <div className="bg-white p-6 shadow-lg rounded-lg h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading trip data...</p>
            </div>
          </div>
        ) : configError ? (
          <div className="bg-white p-6 shadow-lg rounded-lg h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">{configError}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Retry
              </button>
            </div>
          </div>
        ) : !tripResult ? (
          <TripWizard
            cities={selectedState ? config.cities.filter(c => c.stateCode === selectedState.code) : []}
            selectedCityIds={selectedCityIds}
            onCityToggle={handleCityToggle}
            onGenerate={handleGenerate}
            isLoading={loading}
            stateCode={selectedState?.code || 'RJ'}
            error={tripError}
          />
        ) : (
          <ItineraryView result={tripResult} onReset={() => setTripResult(null)} />
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full w-full">
        <Map
          center={selectedState ? [selectedState.center.lat, selectedState.center.lng] : [20.5937, 78.9629]}
          zoom={selectedState ? selectedState.zoom : 5}
          markers={mapMarkers}
          selectedMarkers={selectedCityIds}
          onMarkerClick={handleMarkerClick}
          route={routeCoordinates}
          intercityRoutes={intercityRoutes}
          onStateSelect={handleStateSelect}
        />

        {/* Onboarding hint when no state is selected */}
        {!selectedState && !tripResult && !configLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-lg shadow-lg z-[1000] text-sm text-center pointer-events-none">
            Click on a state to start planning your trip
          </div>
        )}

        {/* Places fetch error */}
        {placesError && (
          <div className="absolute bottom-14 left-4 bg-red-900/80 text-white text-xs px-3 py-1.5 rounded-full z-[1000]">
            Could not load tourist places
          </div>
        )}

        {/* Mobile Toggle Button */}
        <div className="absolute bottom-4 right-4 md:hidden z-[1000]">
          {tripResult && (
            <button
              onClick={() => setActiveTab(activeTab === 'map' ? 'itinerary' : 'map')}
              className="bg-indigo-600 text-white p-3 rounded-full shadow-lg"
            >
              {activeTab === 'map' ? 'View Itinerary' : 'View Map'}
            </button>
          )}
          {!tripResult && (
            <button
              onClick={() => setActiveTab(activeTab === 'map' ? 'itinerary' : 'map')} // 'itinerary' essentially means 'sidebar' here
              className="bg-white text-indigo-600 p-3 rounded-full shadow-lg"
            >
              {activeTab === 'map' ? 'Plan Trip' : 'View Map'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
