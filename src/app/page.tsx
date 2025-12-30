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
        if (data.states.length > 0) setSelectedState(data.states[0]); // Default to first state
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

  // Prepare markers for map - include both cities and places
  const mapMarkers = useMemo(() => {
    const cityMarkers = config.cities.map(c => ({
      id: c._id,
      lat: c.coordinates.lat,
      lng: c.coordinates.lng,
      title: c.name,
      description: c.description
    }));

    const placeMarkers = places.map(p => ({
      id: p._id,
      lat: p.coordinates.lat,
      lng: p.coordinates.lng,
      title: p.name,
      description: `${p.type} in ${p.cityName} - Rating: ${p.rating}/5`
    }));

    return [...cityMarkers, ...placeMarkers];
  }, [config.cities, places]);

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
  }, [tripResult, config.cities]);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
      {/* Sidebar / Overlay Panel */}
      <div className={`absolute md:relative z-20 top-0 left-0 h-full w-full md:w-[450px] transition-transform duration-300 ${activeTab === 'map' ? 'translate-x-full md:translate-x-0' : 'translate-x-0'} md:translate-x-0 flex flex-col`}>
        {!tripResult ? (
          <TripWizard
            cities={config.cities}
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
        {selectedState ? (
          <Map
            center={[selectedState.center.lat, selectedState.center.lng]}
            zoom={selectedState.zoom}
            markers={mapMarkers}
            selectedMarkers={selectedCityIds}
            onMarkerClick={handleCityToggle}
            route={routeCoordinates}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Loading Map...</div>
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
