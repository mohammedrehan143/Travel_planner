import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Check, ChevronDown } from 'lucide-react';

export interface PlaceSuggestion {
  name: string;
  country: string;
  flag: string;
  category: 'city' | 'region' | 'country';
  subtitle?: string;
}

export const POPULAR_DESTINATIONS: PlaceSuggestion[] = [
  { name: 'Bangalore, Karnataka', country: 'India', flag: '🇮🇳', category: 'city', subtitle: 'Silicon Valley of India • Parks & Cafes' },
  { name: 'Saudi Arabia (Riyadh)', country: 'Saudi Arabia', flag: '🇸🇦', category: 'country', subtitle: 'Kingdom Centre • Historic Diriyah' },
  { name: 'Mumbai, Maharashtra', country: 'India', flag: '🇮🇳', category: 'city', subtitle: 'Marine Drive • Gateway of India' },
  { name: 'New Delhi, NCR', country: 'India', flag: '🇮🇳', category: 'city', subtitle: 'Red Fort • India Gate • Street Food' },
  { name: 'Goa (Panaji & Beaches)', country: 'India', flag: '🇮🇳', category: 'region', subtitle: 'Sun, Sand, Seafood & Heritage Churches' },
  { name: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪', category: 'city', subtitle: 'Burj Khalifa • Marina • Desert Safari' },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', category: 'city', subtitle: 'Shibuya • Asakusa • Gastronomy' },
  { name: 'Paris', country: 'France', flag: '🇫🇷', category: 'city', subtitle: 'Eiffel Tower • Louvre • Seine River' },
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧', category: 'city', subtitle: 'Big Ben • Tower Bridge • West End' },
  { name: 'New York City, NY', country: 'United States', flag: '🇺🇸', category: 'city', subtitle: 'Manhattan • Central Park • Broadway' },
  { name: 'Singapore', country: 'Singapore', flag: '🇸🇬', category: 'city', subtitle: 'Marina Bay Sands • Gardens by the Bay' },
  { name: 'Hyderabad, Telangana', country: 'India', flag: '🇮🇳', category: 'city', subtitle: 'Charminar • Biryani • Golconda Fort' },
  { name: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', category: 'city', subtitle: 'Red Sea Corniche • Al-Balad Heritage' },
  { name: 'Kyoto', country: 'Japan', flag: '🇯🇵', category: 'city', subtitle: 'Arashiyama Bamboo Grove • Fushimi Inari' }
];

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Type city or destination...',
  label,
  icon,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = value.trim().toLowerCase();
  const filteredSuggestions = POPULAR_DESTINATIONS.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.country.toLowerCase().includes(query) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query))
  );

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
          {icon || <MapPin className="w-4 h-4" />}
        </div>

        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-900 shadow-2xs"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] font-bold text-slate-500 px-3">
            <span>Suggested Destinations & Cities</span>
            <span className="text-[10px] text-blue-600 font-semibold">Click to select</span>
          </div>

          <div className="divide-y divide-slate-100/80">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((item, idx) => {
                const isSelected = value.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(item.name);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-blue-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/90 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none shrink-0">{item.flag}</span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {item.country}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-1">
                <Search className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Custom Destination: "{value}"</p>
                <p className="text-[11px] text-slate-400">
                  You can proceed with this custom place — our AI will find coordinates and verify attractions!
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold"
                >
                  Use "{value}"
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
