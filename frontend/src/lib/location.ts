/**
 * Auto Location Detector & Geocoding Utilities
 * Defaults to Bangalore, India with automated browser geolocation and timezone detection.
 */

export interface DetectedLocation {
  city: string;
  country: string;
  formatted: string;
  currency: string;
  latitude?: number;
  longitude?: number;
  source: 'gps' | 'timezone' | 'default';
}

export const DEFAULT_LOCATION: DetectedLocation = {
  city: 'Bangalore',
  country: 'India',
  formatted: 'Bangalore, Karnataka, India',
  currency: 'INR',
  latitude: 12.9716,
  longitude: 77.5946,
  source: 'default',
};

// Known reference cities for fast distance matching
const REFERENCE_CITIES = [
  { city: 'Bangalore', country: 'India', formatted: 'Bangalore, Karnataka, India', lat: 12.9716, lng: 77.5946, currency: 'INR' },
  { city: 'Mumbai', country: 'India', formatted: 'Mumbai, Maharashtra, India', lat: 19.0760, lng: 72.8777, currency: 'INR' },
  { city: 'New Delhi', country: 'India', formatted: 'New Delhi, NCR, India', lat: 28.6139, lng: 77.2090, currency: 'INR' },
  { city: 'Hyderabad', country: 'India', formatted: 'Hyderabad, Telangana, India', lat: 17.3850, lng: 78.4867, currency: 'INR' },
  { city: 'Chennai', country: 'India', formatted: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707, currency: 'INR' },
  { city: 'Kolkata', country: 'India', formatted: 'Kolkata, West Bengal, India', lat: 22.5726, lng: 88.3639, currency: 'INR' },
  { city: 'Pune', country: 'India', formatted: 'Pune, Maharashtra, India', lat: 18.5204, lng: 73.8567, currency: 'INR' },
  { city: 'Goa', country: 'India', formatted: 'Goa (Panaji), India', lat: 15.2993, lng: 74.1240, currency: 'INR' },
  { city: 'Jaipur', country: 'India', formatted: 'Jaipur, Rajasthan, India', lat: 26.9124, lng: 75.7873, currency: 'INR' },
  { city: 'Kochi', country: 'India', formatted: 'Kochi, Kerala, India', lat: 9.9312, lng: 76.2673, currency: 'INR' },
  { city: 'Dubai', country: 'United Arab Emirates', formatted: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, currency: 'AED' },
  { city: 'London', country: 'United Kingdom', formatted: 'London, United Kingdom', lat: 51.5074, lng: -0.1278, currency: 'GBP' },
  { city: 'Paris', country: 'France', formatted: 'Paris, France', lat: 48.8566, lng: 2.3522, currency: 'EUR' },
  { city: 'Tokyo', country: 'Japan', formatted: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, currency: 'JPY' },
  { city: 'Singapore', country: 'Singapore', formatted: 'Singapore', lat: 1.3521, lng: 103.8198, currency: 'SGD' },
  { city: 'New York', country: 'United States', formatted: 'New York City, NY, USA', lat: 40.7128, lng: -74.0060, currency: 'USD' }
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Automatically detects the user's location using browser GPS or timezone,
 * falling back reliably to Bangalore, India.
 */
export async function detectLocation(requestGps = false): Promise<DetectedLocation> {
  // 1. Check local storage cache first if available
  try {
    const cached = localStorage.getItem('trippilot_user_location');
    if (cached && !requestGps) {
      const parsed = JSON.parse(cached);
      if (parsed?.formatted) {
        return parsed as DetectedLocation;
      }
    }
  } catch {
    // Ignore localStorage parse issues
  }

  // 2. If browser geolocation is available and requested or permitted
  if (typeof window !== 'undefined' && 'geolocation' in navigator && (requestGps || (navigator as any).permissions)) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4500,
          maximumAge: 3600000,
        });
      });

      const { latitude, longitude } = pos.coords;

      // Find closest known city within 150 km
      let closestCity = REFERENCE_CITIES[0];
      let minDistance = Infinity;

      for (const ref of REFERENCE_CITIES) {
        const dist = getDistanceKm(latitude, longitude, ref.lat, ref.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestCity = ref;
        }
      }

      // If within 150km of reference city (e.g. Bangalore or nearby)
      if (minDistance <= 150) {
        const detected: DetectedLocation = {
          city: closestCity.city,
          country: closestCity.country,
          formatted: closestCity.formatted,
          currency: closestCity.currency,
          latitude,
          longitude,
          source: 'gps',
        };
        try {
          localStorage.setItem('trippilot_user_location', JSON.stringify(detected));
        } catch { /* noop */ }
        return detected;
      }

      // Quick reverse geocode fallback using BigDataCloud free client reverse geocoder
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || closestCity.city;
          const country = data.countryName || closestCity.country;
          const countryCode = (data.countryCode || 'IN').toUpperCase();
          const currency = countryCode === 'IN' ? 'INR' : closestCity.currency || 'INR';

          const detected: DetectedLocation = {
            city,
            country,
            formatted: `${city}, ${country}`,
            currency,
            latitude,
            longitude,
            source: 'gps',
          };
          try {
            localStorage.setItem('trippilot_user_location', JSON.stringify(detected));
          } catch { /* noop */ }
          return detected;
        }
      } catch {
        // Fall through to closestCity
      }

      const fallbackGps: DetectedLocation = {
        city: closestCity.city,
        country: closestCity.country,
        formatted: closestCity.formatted,
        currency: closestCity.currency,
        latitude,
        longitude,
        source: 'gps',
      };
      try {
        localStorage.setItem('trippilot_user_location', JSON.stringify(fallbackGps));
      } catch { /* noop */ }
      return fallbackGps;
    } catch {
      // User denied or GPS timed out -> gracefully continue to timezone fallback
    }
  }

  // 3. Timezone detection fallback
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.startsWith('Asia/Kolkata')) {
      return DEFAULT_LOCATION;
    }
    if (tz.includes('Dubai')) {
      return { city: 'Dubai', country: 'United Arab Emirates', formatted: 'Dubai, UAE', currency: 'AED', source: 'timezone' };
    }
    if (tz.includes('London')) {
      return { city: 'London', country: 'United Kingdom', formatted: 'London, UK', currency: 'GBP', source: 'timezone' };
    }
    if (tz.includes('Tokyo')) {
      return { city: 'Tokyo', country: 'Japan', formatted: 'Tokyo, Japan', currency: 'JPY', source: 'timezone' };
    }
  } catch {
    // Ignore timezone detection errors
  }

  // 4. Default guaranteed fallback: Bangalore, India
  return DEFAULT_LOCATION;
}
