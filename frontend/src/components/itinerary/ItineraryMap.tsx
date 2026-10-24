import React, { useState, useEffect } from 'react';
import { Activity, Trip } from '../../types';
import { MapPin, Navigation, Compass, ZoomIn, ZoomOut, ExternalLink, Globe } from 'lucide-react';
import { formatCurrency } from '../../lib/currency';

interface ItineraryMapProps {
  trip: Trip;
  activities: Activity[];
  selectedDayNumber?: number;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({
  trip,
  activities,
  selectedDayNumber = 1,
}) => {
  const [activePin, setActivePin] = useState<Activity | null>(activities[0] || null);
  const [mapMode, setMapMode] = useState<'streets' | 'satellite' | 'terrain' | 'osm'>('streets');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Sync activePin whenever activities or selectedDayNumber changes
  useEffect(() => {
    setActivePin(activities[0] || null);
  }, [activities, selectedDayNumber]);

  // If no activities with coordinates, fallback to destination coords
  const centerLat = trip.destination_lat || 35.6762;
  const centerLng = trip.destination_lng || 139.6503;

  // Function to project lat/lng to SVG canvas percentage coordinates
  const getCoordinates = (lat?: number, lng?: number, index: number = 0) => {
    if (!lat || !lng) {
      const angle = (index * (360 / Math.max(1, activities.length))) * (Math.PI / 180);
      const radius = 25;
      return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    }

    const deltaLat = (lat - centerLat) * 300;
    const deltaLng = (lng - centerLng) * 300;

    const x = Math.min(88, Math.max(12, 50 + deltaLng * zoomLevel));
    const y = Math.min(88, Math.max(12, 50 - deltaLat * zoomLevel));
    return { x, y };
  };

  const points = activities.map((act, i) => ({
    activity: act,
    ...getCoordinates(act.latitude, act.longitude, i),
  }));

  const pathD = points.length > 1
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  // Calculate free OpenStreetMap bounding box for iframe layer
  const osmDelta = 0.05 / Math.max(0.5, zoomLevel);
  const targetLat = activePin?.latitude || centerLat;
  const targetLng = activePin?.longitude || centerLng;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(targetLng - osmDelta).toFixed(4)}%2C${(targetLat - osmDelta).toFixed(4)}%2C${(targetLng + osmDelta).toFixed(4)}%2C${(targetLat + osmDelta).toFixed(4)}&layer=mapnik&marker=${targetLat.toFixed(5)}%2C${targetLng.toFixed(5)}`;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-card overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 bg-[#F3F4F6]/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#171717] text-[#F97316] flex items-center justify-center">
            <Navigation className="w-4 h-4 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#171717] flex items-center gap-2">
              <span>Interactive Route Map & Locations</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#F97316] text-[10px] font-bold">
                Live Geocluster
              </span>
            </h3>
            <p className="text-xs text-[#525252]">
              {activities.length} waypoints • Day {selectedDayNumber} Route
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Map style toggle */}
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-xl p-0.5 text-xs font-medium shadow-sm">
            <button
              onClick={() => setMapMode('streets')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${mapMode === 'streets' ? 'bg-[#F97316] text-white font-bold' : 'text-[#525252] hover:text-[#171717]'}`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${mapMode === 'terrain' ? 'bg-[#F97316] text-white font-bold' : 'text-[#525252] hover:text-[#171717]'}`}
            >
              Light
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${mapMode === 'satellite' ? 'bg-[#171717] text-white font-bold' : 'text-[#525252] hover:text-[#171717]'}`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapMode('osm')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${mapMode === 'osm' ? 'bg-[#171717] text-[#F97316] font-bold' : 'text-[#525252] hover:text-[#171717]'}`}
              title="View live free OpenStreetMap satellite/street tile layer"
            >
              <Globe className="w-3 h-3" />
              <span>OSM</span>
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center bg-white border border-[#E5E7EB] rounded-xl text-[#525252] shadow-sm">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 hover:bg-[#F3F4F6] rounded-l-xl border-r border-[#E5E7EB] hover:text-[#171717]"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 hover:bg-[#F3F4F6] rounded-r-xl hover:text-[#171717]"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div
        className={`relative w-full h-[400px] overflow-hidden select-none transition-colors duration-300 ${
          mapMode === 'satellite'
            ? 'bg-[#171717]'
            : mapMode === 'terrain'
            ? 'bg-white'
            : 'bg-[#F3F4F6]'
        }`}
      >
        {mapMode === 'osm' ? (
          /* Live Free OpenStreetMap Embed Layer */
          <div className="relative w-full h-full">
            <iframe
              title="Free OpenStreetMap Tile Layer"
              src={osmEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#E5E7EB] shadow-sm text-[11px] text-[#525252] font-medium">
              OpenStreetMap View
            </div>
          </div>
        ) : (
          /* Vector Route Canvas */
          <>
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(${mapMode === 'satellite' ? '#404040' : '#D4D4D4'} 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              preserveAspectRatio="none"
            >
              <path d="M 0 30 Q 50 40 100 25" stroke={mapMode === 'satellite' ? '#525252' : '#A3A3A3'} strokeWidth="1.5" fill="none" />
              <path d="M 20 0 Q 30 50 15 100" stroke={mapMode === 'satellite' ? '#525252' : '#A3A3A3'} strokeWidth="1.2" fill="none" />
              <path d="M 70 0 Q 60 60 85 100" stroke={mapMode === 'satellite' ? '#525252' : '#A3A3A3'} strokeWidth="1.2" fill="none" />
              <path d="M 0 75 Q 40 70 100 80" stroke={mapMode === 'satellite' ? '#525252' : '#A3A3A3'} strokeWidth="1" fill="none" />
            </svg>

            {/* Route Connection Path */}
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              {pathD && (
                <>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(249, 115, 22, 0.2)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="1.8"
                    strokeDasharray="3,2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>

            {/* Interactive Waypoint Pins */}
            {points.map((pt, i) => {
              const isSelected = activePin?.id === pt.activity.id;
              return (
                <div
                  key={pt.activity.id}
                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                  onClick={() => setActivePin(pt.activity)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  <div
                    className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                      isSelected
                        ? 'w-9 h-9 bg-[#F97316] text-white shadow-lg ring-4 ring-orange-200 scale-110 z-30'
                        : 'w-7 h-7 bg-white text-[#171717] shadow-md border-2 border-[#171717] hover:border-[#F97316] hover:scale-110'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{i + 1}</span>
                  </div>

                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#171717] text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-40 border border-neutral-700">
                    <span className="font-semibold">{pt.activity.title}</span>
                    <span className="block text-[10px] text-neutral-300">
                      {pt.activity.start_time} • {pt.activity.location_name}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Destination Center Badge */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-2 text-xs z-30">
          <Compass className="w-4 h-4 text-[#F97316]" />
          <span className="font-bold text-[#171717]">{trip.destination}</span>
          <span className="text-[#525252]">• {centerLat.toFixed(2)}, {centerLng.toFixed(2)}</span>
        </div>

        {/* Active Pin Floating Card on Map */}
        {activePin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5E7EB] shadow-xl p-4 z-30 animate-in fade-in duration-150 text-[#171717]">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-[#F97316] border border-orange-200">
                {activePin.category}
              </span>
              <span className="text-xs font-semibold text-[#525252]">
                {activePin.start_time} - {activePin.end_time}
              </span>
            </div>

            <h5 className="font-bold text-sm text-[#171717] mt-1.5 line-clamp-1">{activePin.title}</h5>
            <p className="text-xs text-[#525252] flex items-center gap-1 mt-1 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
              {activePin.location_name}
            </p>

            <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#171717]">
                {activePin.estimated_cost === 0
                  ? 'Free entry'
                  : `Est. ${formatCurrency(activePin.estimated_cost, activePin.currency)}`}
              </span>

              <div className="flex items-center gap-3">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${activePin.latitude || centerLat}&mlon=${activePin.longitude || centerLng}#map=16/${activePin.latitude || centerLat}/${activePin.longitude || centerLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#525252] hover:text-[#171717] font-medium hover:underline"
                >
                  <span>OpenStreetMap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${activePin.location_name} ${activePin.location_address || trip.destination}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#F97316] hover:text-[#EA580C] font-semibold hover:underline"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Waypoint Steps Strip */}
      <div className="px-6 py-3 bg-[#F3F4F6] border-t border-[#E5E7EB] overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-bold text-[#525252] uppercase tracking-wider mr-2">Route:</span>
          {activities.map((act, idx) => (
            <button
              key={act.id}
              onClick={() => setActivePin(act)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activePin?.id === act.id
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : 'bg-white border border-[#E5E7EB] text-[#171717] hover:bg-neutral-50'
              }`}
            >
              <span className="font-bold">{idx + 1}.</span>
              <span className="truncate max-w-[120px]">{act.location_name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
