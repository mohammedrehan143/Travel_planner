import React, { useState } from 'react';
import { Activity, Trip } from '../../types';
import { MapPin, Navigation, Compass, Layers, ZoomIn, ZoomOut, Maximize2, ExternalLink } from 'lucide-react';

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
  const [mapMode, setMapMode] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // If no activities with coordinates, fallback to destination coords
  const validActivities = activities.filter((a) => a.latitude && a.longitude);

  // Calculate bounding box or relative positions for interactive canvas
  const centerLat = trip.destination_lat || 35.6762;
  const centerLng = trip.destination_lng || 139.6503;

  // Function to project lat/lng to SVG canvas percentage coordinates
  const getCoordinates = (lat?: number, lng?: number, index: number = 0) => {
    if (!lat || !lng) {
      // Deterministic layout if coordinates are approximate
      const angle = (index * (360 / Math.max(1, activities.length))) * (Math.PI / 180);
      const radius = 25;
      return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    }

    // Relative delta from destination center
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

  // Build SVG path string connecting sequential points
  const pathD = points.length > 1
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Map Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Interactive Route Map & Locations
            </h3>
            <p className="text-xs text-slate-500">
              {activities.length} waypoints • Day {selectedDayNumber} Geocluster
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Map style toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setMapMode('streets')}
              className={`px-2 py-1 rounded ${mapMode === 'streets' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`px-2 py-1 rounded ${mapMode === 'terrain' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Terrain
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-1 rounded ${mapMode === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Dark
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg text-slate-600">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
              className="p-1.5 hover:bg-slate-100 rounded-l border-r border-slate-200"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 hover:bg-slate-100 rounded-r"
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
            ? 'bg-slate-950'
            : mapMode === 'terrain'
            ? 'bg-[#eef2e6]'
            : 'bg-[#f8fafc]'
        }`}
      >
        {/* Subtle grid and terrain contour simulation */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${mapMode === 'satellite' ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Map City Roads overlay */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          preserveAspectRatio="none"
        >
          <path d="M 0 30 Q 50 40 100 25" stroke={mapMode === 'satellite' ? '#64748b' : '#94a3b8'} strokeWidth="1.5" fill="none" />
          <path d="M 20 0 Q 30 50 15 100" stroke={mapMode === 'satellite' ? '#64748b' : '#94a3b8'} strokeWidth="1.2" fill="none" />
          <path d="M 70 0 Q 60 60 85 100" stroke={mapMode === 'satellite' ? '#64748b' : '#94a3b8'} strokeWidth="1.2" fill="none" />
          <path d="M 0 75 Q 40 70 100 80" stroke={mapMode === 'satellite' ? '#64748b' : '#94a3b8'} strokeWidth="1" fill="none" />
        </svg>

        {/* Route Connection Path */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {pathD && (
            <>
              {/* Route shadow */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(37, 99, 235, 0.2)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Route primary line */}
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="1.8"
                strokeDasharray="3,2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
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
              {/* Pin Ring */}
              <div
                className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                  isSelected
                    ? 'w-9 h-9 bg-blue-600 text-white shadow-lg ring-4 ring-blue-400/40 scale-110 z-30'
                    : 'w-7 h-7 bg-white text-slate-700 shadow-md border-2 border-blue-600 hover:scale-110'
                }`}
              >
                <span className="text-xs font-extrabold">{i + 1}</span>

                {/* Pulse dot for active pin */}
                {isSelected && (
                  <span className="absolute -inset-1 rounded-full bg-blue-500 opacity-30 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Pin tooltip label */}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-40">
                <span className="font-semibold">{pt.activity.title}</span>
                <span className="block text-[10px] text-slate-300">
                  {pt.activity.start_time} • {pt.activity.location_name}
                </span>
              </div>
            </div>
          );
        })}

        {/* Destination Center Badge */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-2 text-xs">
          <Compass className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800">{trip.destination}</span>
          <span className="text-slate-400">• Coordinates: {centerLat.toFixed(2)}, {centerLng.toFixed(2)}</span>
        </div>

        {/* Active Pin Floating Card on Map */}
        {activePin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                {activePin.category}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {activePin.start_time} - {activePin.end_time}
              </span>
            </div>

            <h5 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">{activePin.title}</h5>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              {activePin.location_name}
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600">
                {activePin.estimated_cost === 0 ? 'Free entry' : `Est. $${activePin.estimated_cost}`}
              </span>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${activePin.location_name} ${activePin.location_address || trip.destination}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Waypoint Steps Strip */}
      <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-4 min-w-max">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sequential Route:</span>
          {activities.map((act, idx) => (
            <button
              key={act.id}
              onClick={() => setActivePin(act)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activePin?.id === act.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
