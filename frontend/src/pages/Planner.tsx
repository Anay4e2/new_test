import { FC, useState, useEffect, useMemo } from 'react';
import { TripWizard } from '@/components/Wizard/TripWizard';
import { ItineraryView } from '@/components/Itinerary/ItineraryView';
import { Map } from '@/components/Map/Map';
import { TripRequest, TripResult } from '@/lib/types';
import axios from 'axios';

export const Planner: FC = () => {
  const [config, setConfig] = useState<{ states: any[], cities: any[] }>({ states: [], cities: [] });
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);
  const [tripResult, setTripResult] = useState<TripResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'itinerary'>('map');

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

  // Prepare markers for map
  const mapMarkers = useMemo(() => {
    return config.cities.map(c => ({
      id: c._id,
      lat: c.coordinates.lat,
      lng: c.coordinates.lng,
      title: c.name,
      description: c.description
    }));
  }, [config.cities]);

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

  return (
    <div className="flex h-screen w-full bg-neutral overflow-hidden relative">
      {/* Sidebar / Overlay Panel */}
      <div className={`absolute md:relative z-20 top-0 left-0 h-full w-full md:w-[500px] transition-transform duration-500 ease-in-out ${activeTab === 'map' ? 'translate-x-full md:translate-x-0' : 'translate-x-0'} md:translate-x-0 flex flex-col p-4 pointer-events-none`}>
         <div className="pointer-events-auto h-full">
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
        <div className="absolute bottom-6 right-6 md:hidden z-[1000]">
           {tripResult && (
             <button
               onClick={() => setActiveTab(activeTab === 'map' ? 'itinerary' : 'map')}
               className="bg-accent text-white p-4 rounded-full shadow-xl font-bold"
             >
               {activeTab === 'map' ? 'View Itinerary' : 'View Map'}
             </button>
           )}
           {!tripResult && (
             <button
                onClick={() => setActiveTab(activeTab === 'map' ? 'itinerary' : 'map')} // 'itinerary' essentially means 'sidebar' here
                className="bg-white text-accent p-4 rounded-full shadow-xl font-bold"
             >
                {activeTab === 'map' ? 'Plan Trip' : 'View Map'}
             </button>
           )}
        </div>
      </div>
    </div>
  );
}
