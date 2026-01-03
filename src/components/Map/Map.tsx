'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// Fix Leaflet icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
    visitDuration?: string;
    bestTime?: string;
    entryFee?: string;
  }>;
  selectedMarkers?: string[];
  onMarkerClick?: (id: string) => void;
  route?: Array<[number, number]>;
  intercityRoutes?: Array<{
    from: [number, number];
    to: [number, number];
    color?: string;
  }>;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
const [activeState, setActiveState] = useState<string | null>(null);

// Custom Icons
const UnselectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-teal.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SelectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

useEffect(() => {
  fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson')
    .then(res => res.json())
    .then(data => setGeoData(data))
    .catch(err => console.error('Failed to load GeoJSON', err));
}, []);

const highlightFeature = (e: any) => {
  const layer = e.target;
  // @ts-ignore
  const stateName = layer.feature.properties.NAME_1 || layer.feature.properties.ST_NM;

  layer.setStyle({
    weight: 3,
    color: '#ff7f50', // Coral/Orange
    dashArray: '',
    fillOpacity: 0.7
  });

  layer.bringToFront();
  setActiveState(stateName);
};

const resetHighlight = (e: any) => {
  const layer = e.target;
  layer.setStyle({
    fillColor: '#3b82f6',
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.2
  });
  setActiveState(null);
};

const onEachFeature = (feature: any, layer: any) => {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: (e: any) => {
      if (onStateSelect && feature.properties) {
        // @ts-ignore
        const name = feature.properties.NAME_1 || feature.properties.ST_NM;
        onStateSelect(name);
      }
    }
  });
};

const defaultStyle = {
  fillColor: '#3b82f6',
  weight: 1,
  opacity: 1,
  color: 'white',
  dashArray: '3',
  fillOpacity: 0.2
};

return (
  <div className="relative h-full w-full bg-neutral-900">
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      className="z-0"
    >
      <MapUpdater center={center} zoom={zoom} />

      {/* Premium Dark Tiles */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {geoData && (
        // @ts-ignore
        <GeoJSON
          data={geoData}
          style={defaultStyle}
          // @ts-ignore
          onEachFeature={onEachFeature}
        />
      )}

      {/* Routes */}
      {intercityRoutes && intercityRoutes.map((route, idx) => (
        <Polyline
          key={`intercity-${idx}`}
          positions={[route.from, route.to]}
          pathOptions={{ color: route.color || '#10b981', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
        />
      ))}

      {route && route.length > 1 && (
        <Polyline
          positions={route}
          pathOptions={{ color: '#ec4899', weight: 4, opacity: 0.8 }}
        />
      )}

      {/* Markers */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={selectedMarkers.includes(marker.id) ? SelectedIcon : UnselectedIcon}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(marker.id),
          }}
        >
          <Popup className="min-w-[200px] font-sans">
            <div className="p-1">
              <h3 className="font-bold text-lg text-primary">{marker.title}</h3>
              {marker.description && <p className="text-sm text-gray-600 mb-2">{marker.description}</p>}

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2 border-t pt-2">
                {marker.visitDuration && <span>⏱ {marker.visitDuration}</span>}
                {marker.bestTime && <span>📅 {marker.bestTime}</span>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>

    {/* Floating Tooltip for Active State */}
    {activeState && (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full border border-white/20 shadow-2xl z-[1000] pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
        <span className="text-lg font-light tracking-widest">{activeState}</span>
      </div>
    )}
  </div>
);
