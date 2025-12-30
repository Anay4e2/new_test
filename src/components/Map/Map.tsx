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

export default function Map({ center, zoom, markers = [], selectedMarkers = [], onMarkerClick, route, intercityRoutes, onStateSelect }: MapProps & { onStateSelect?: (stateName: string) => void }) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error('Failed to load GeoJSON', err));
  }, []);

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        // Reset style
        layer.setStyle({
          weight: 1,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.2
        });
      },
      click: (e: any) => {
        if (onStateSelect && feature.properties && feature.properties.NAME_1) {
          onStateSelect(feature.properties.NAME_1);
        }
      }
    });
  };

  const mapStyle = {
    fillColor: '#3388ff',
    weight: 1,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.2
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapUpdater center={center} zoom={zoom} />

      {geoData && (
        // @ts-ignore
        <GeoJSON
          data={geoData}
          style={mapStyle}
          // @ts-ignore
          onEachFeature={onEachFeature}
        />
      )}

      {intercityRoutes && intercityRoutes.map((route, idx) => (
        <Polyline
          key={`intercity-${idx}`}
          positions={[route.from, route.to]}
          color={route.color || "green"}
          dashArray="5, 10"
          weight={2}
          opacity={0.5}
        />
      ))}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          opacity={selectedMarkers.includes(marker.id) ? 1 : 0.6}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(marker.id),
          }}
        >
          <Popup className="min-w-[200px]">
            <div className="p-1">
              <strong className="text-lg block mb-1">{marker.title}</strong>
              {marker.description && <p className="text-sm text-gray-600 mb-2">{marker.description}</p>}

              <div className="text-xs space-y-1 mt-2 border-t pt-2">
                {marker.visitDuration && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">⏱ Duration:</span> {marker.visitDuration}
                  </div>
                )}
                {marker.bestTime && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">📅 Best Time:</span> {marker.bestTime}
                  </div>
                )}
                {marker.entryFee && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">🎟 Entry:</span> {marker.entryFee}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {route && route.length > 1 && (
        <Polyline positions={route} color="blue" />
      )}
    </MapContainer>
  );
}
