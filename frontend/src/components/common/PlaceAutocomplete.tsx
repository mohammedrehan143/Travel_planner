import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Check, ChevronDown } from 'lucide-react';

export interface PlaceSuggestion {
  name: string;
  country: string;
  category: 'city' | 'country' | 'region';
  subtitle?: string;
}

export const POPULAR_DESTINATIONS: PlaceSuggestion[] = [
  { name: 'Bangalore, Karnataka', country: 'India', category: 'city', subtitle: 'Silicon Valley of India • Parks & Cafes' },
  { name: 'Saudi Arabia (Riyadh)', country: 'Saudi Arabia', category: 'country', subtitle: 'Kingdom Centre • Historic Diriyah' },
  { name: 'Mumbai, Maharashtra', country: 'India', category: 'city', subtitle: 'Marine Drive • Gateway of India' },
  { name: 'New Delhi, NCR', country: 'India', category: 'city', subtitle: 'Red Fort • India Gate • Street Food' },
  { name: 'Goa (Panaji & Beaches)', country: 'India', category: 'region', subtitle: 'Sun, Sand, Seafood & Heritage Churches' },
  { name: 'Dubai', country: 'United Arab Emirates', category: 'city', subtitle: 'Burj Khalifa • Marina • Desert Safari' },
  { name: 'Tokyo', country: 'Japan', category: 'city', subtitle: 'Shibuya • Asakusa • Gastronomy' },
  { name: 'Paris', country: 'France', category: 'city', subtitle: 'Eiffel Tower • Louvre • Seine River' },
  { name: 'London', country: 'United Kingdom', category: 'city', subtitle: 'Big Ben • Tower Bridge • West End' },
  { name: 'New York City, NY', country: 'United States', category: 'city', subtitle: 'Manhattan • Central Park • Broadway' },
  { name: 'Singapore', country: 'Singapore', category: 'city', subtitle: 'Marina Bay Sands • Gardens by the Bay' },
  { name: 'Hyderabad, Telangana', country: 'India', category: 'city', subtitle: 'Charminar • Biryani • Golconda Fort' },
  { name: 'Jeddah', country: 'Saudi Arabia', category: 'city', subtitle: 'Red Sea Corniche • Al-Balad Heritage' },
  { name: 'Kyoto', country: 'Japan', category: 'city', subtitle: 'Arashiyama Bamboo Grove • Fushimi Inari' }
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

  const filteredSuggestions = POPULAR_DESTINATIONS.filter((p) => {
    if (!value || value.trim().length === 0) return true;
    const v = value.toLowerCase();
    return (
      p.name.toLowerCase().includes(v) ||
      p.country.toLowerCase().includes(v) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(v))
    );
  });

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3.5 top-3 text-neutral-400 pointer-events-none">
          {icon || <MapPin className="w-4 h-4 text-[#1E60FF]" />}
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
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#E5E7EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#1E60FF] bg-white font-medium text-[#171717] placeholder:text-neutral-400 shadow-sm transition-all"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-3 text-neutral-400 hover:text-[#171717] transition-colors"
          tabIndex={-1}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in duration-150">
          <div className="p-2.5 border-b border-[#E5E7EB] bg-[#F3F4F6] flex items-center justify-between text-[11px] font-bold text-[#525252] px-3.5">
            <span>Suggested Destinations</span>
            <span className="text-[10px] text-[#1E60FF] font-semibold">Click to select</span>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
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
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 hover:bg-[#F3F4F6] transition-colors ${
                      isSelected ? 'bg-blue-50 font-bold border-l-2 border-[#1E60FF]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#EBF2FF] text-[#1E60FF] flex items-center justify-center shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#171717] truncate">{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F3F4F6] text-[#525252] font-medium border border-[#E5E7EB]">
                            {item.country}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="text-[11px] text-[#525252] truncate mt-0.5">{item.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#1E60FF] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center space-y-2">
                <Search className="w-5 h-5 text-neutral-400 mx-auto" />
                <p className="text-xs font-semibold text-[#171717]">Custom Destination: "{value}"</p>
                <p className="text-[11px] text-[#525252]">
                  You can proceed with this custom place — our AI will find coordinates and verify attractions!
                </p>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#1E60FF] hover:bg-[#0052FF] text-white text-[11px] font-bold transition-colors"
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
