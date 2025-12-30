'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import TripWizard from '@/components/Wizard/TripWizard';
import ItineraryView from '@/components/Itinerary/ItineraryView';
import { TripRequest, TripResult } from '@/lib/planner';
import { MapPin } from 'lucide-react';

// Dynamic import for Leaflet map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map/Map'), { ssr: false });

export default function Home() {
  const [config, setConfig] = useState<{ states: any[], cities: any[] }>({ states: [], cities: [] });
  const [places, setPlaces] = useState<any[]>([]);
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'itinerary'>('map');

  useEffect(() => {
    // Fetch config (states and cities)
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        // Removed default state selection to show whole India initially
        // if (data.states.length > 0) setSelectedState(data.states[0]); 
      });

    // Fetch places for map markers
    fetch('/api/places')
      .then(res => res.json())
      .then(data => {
        setPlaces(data);
      })
      .catch(err => console.error('Error fetching places:', err));
  }, []);

  const handleCityToggle = (id: string) => {
    if (selectedCityIds.includes(id)) {
      setSelectedCityIds(selectedCityIds.filter(c => c !== id));
    } else {
      setSelectedCityIds([...selectedCityIds, id]);
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
      setActiveTab('itinerary'); // Switch to itinerary view on mobile automatically
    } catch (e) {
      console.error(e);
      alert('Failed to generate trip. Please try again.');
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
      visitDuration: p.visitDuration,
      bestTime: p.bestTime,
      entryFee: p.entryFee
    }));

    return [...cityMarkers, ...placeMarkers];
  }, [config.cities, places, selectedState]);

  // Generate route coordinates for the map if result exists
  const routeCoordinates: Array<[number, number]> | undefined = useMemo(() => {
    if (!tripResult) return undefined;

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
  }, [tripResult]);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
      {/* Sidebar / Overlay Panel */}
      <div className={`absolute md:relative z-20 top-0 left-0 h-full w-full md:w-[450px] transition-transform duration-300 ${activeTab === 'map' ? 'translate-x-full md:translate-x-0' : 'translate-x-0'} md:translate-x-0 flex flex-col`}>
        {!tripResult ? (
          <TripWizard
            cities={selectedState ? config.cities.filter(c => c.stateCode === selectedState.code) : []}
            selectedCityIds={selectedCityIds}
            onCityToggle={handleCityToggle}
            onGenerate={handleGenerate}
            isLoading={loading}
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
          onMarkerClick={handleCityToggle}
          route={routeCoordinates}
          intercityRoutes={intercityRoutes}
          onStateSelect={handleStateSelect}
        />

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
