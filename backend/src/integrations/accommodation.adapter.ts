import { PlacesAdapter } from './places.adapter.js';
import { CurrencyAdapter } from './currency.adapter.js';

export interface AccommodationOption {
  name: string;
  type: 'hotel' | 'hostel' | 'resort' | 'apartment' | 'villa';
  address: string;
  nightlyRate: number;
  totalPrice: number;
  currency: string;
  rating: number;
  latitude: number;
  longitude: number;
  bookingStatus: 'not_booked';
  bookingUrl?: string;
  amenities: string[];
}

export class AccommodationAdapter {
  /**
   * Search for lodging options at the destination matching style and duration.
   */
  static async searchLodging(
    destination: string,
    durationNights: number,
    travelStyle = 'balanced',
    currency = 'USD'
  ): Promise<AccommodationOption[]> {
    const coords = await PlacesAdapter.getDestinationCoordinates(destination);
    const destKey = destination.toLowerCase().trim().split(/[, ]+/)[0];

    // Style multipliers
    let baseRate = 140;
    let preferredType: 'hotel' | 'hostel' | 'resort' | 'apartment' | 'villa' = 'hotel';

    if (travelStyle === 'budget' || travelStyle === 'backpacking') {
      baseRate = 45;
      preferredType = 'hostel';
    } else if (travelStyle === 'luxury') {
      baseRate = 420;
      preferredType = 'resort';
    } else if (travelStyle === 'cultural' || travelStyle === 'relaxed') {
      baseRate = 180;
      preferredType = 'hotel';
    }

    const currUpper = (currency || 'USD').toUpperCase();
    if (currUpper !== 'USD') {
      try {
        const { rate } = await CurrencyAdapter.convert(1, 'USD', currUpper);
        if (rate && rate > 0) {
          baseRate = Math.round(baseRate * rate);
        }
      } catch {
        // preserve baseRate if conversion fails
      }
    }

    const suggestions: AccommodationOption[] = [
      {
        name: `${destination} Central Premier ${preferredType === 'hostel' ? 'Hostel' : 'Hotel'}`,
        type: preferredType,
        address: `12 Grand Boulevard, Central District, ${destination}`,
        nightlyRate: baseRate,
        totalPrice: baseRate * durationNights,
        currency,
        rating: 4.6,
        latitude: coords.lat + 0.003,
        longitude: coords.lng + 0.002,
        bookingStatus: 'not_booked',
        bookingUrl: 'https://www.booking.com',
        amenities: ['Free High-Speed Wi-Fi', 'Breakfast Buffet Included', '24-Hour Front Desk', 'Concierge']
      },
      {
        name: `${destination} Heritage Boutique Suites`,
        type: preferredType === 'resort' ? 'resort' : 'apartment',
        address: `45 Old Quarter Lane, ${destination}`,
        nightlyRate: Math.round(baseRate * 1.25),
        totalPrice: Math.round(baseRate * 1.25 * durationNights),
        currency,
        rating: 4.8,
        latitude: coords.lat - 0.004,
        longitude: coords.lng + 0.005,
        bookingStatus: 'not_booked',
        bookingUrl: 'https://www.airbnb.com',
        amenities: ['Historic Architecture', 'Kitchenette', 'Quiet Courtyard', 'Espresso Machine']
      },
      {
        name: `${destination} Riverside Eco Lodgings`,
        type: 'hotel',
        address: `88 Promenade Way, ${destination}`,
        nightlyRate: Math.round(baseRate * 0.9),
        totalPrice: Math.round(baseRate * 0.9 * durationNights),
        currency,
        rating: 4.4,
        latitude: coords.lat + 0.006,
        longitude: coords.lng - 0.003,
        bookingStatus: 'not_booked',
        bookingUrl: 'https://www.booking.com',
        amenities: ['River Views', 'Bicycle Rental', 'Organic Breakfast', 'Eco Certified']
      }
    ];

    return suggestions;
  }
}
