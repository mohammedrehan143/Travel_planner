import { describe, it, expect } from 'vitest';
import { PlacesAdapter } from '../src/integrations/places.adapter.js';
import { WeatherAdapter } from '../src/integrations/weather.adapter.js';
import { RoutesAdapter } from '../src/integrations/routes.adapter.js';
import { CurrencyAdapter } from '../src/integrations/currency.adapter.js';
import { AccommodationAdapter } from '../src/integrations/accommodation.adapter.js';

describe('External Integration Adapters Suite', () => {
  it('PlacesAdapter: resolves coordinates and searches places', async () => {
    const coords = await PlacesAdapter.getDestinationCoordinates('Tokyo, Japan');
    expect(coords.lat).toBeCloseTo(35.67, 1);
    expect(coords.lng).toBeCloseTo(139.65, 1);

    const search = await PlacesAdapter.searchPlaces('temple', 'Tokyo, Japan', 'cultural', 5);
    expect(search.places.length).toBeGreaterThan(0);
    expect(search.source).toBeDefined();
  });

  it('WeatherAdapter: fetches or estimates forecast', async () => {
    const res = await WeatherAdapter.getForecast('Paris, France', '2026-11-01', '2026-11-04');
    expect(res.forecast.length).toBe(4);
    expect(res.forecast[0].temperatureMaxC).toBeTypeOf('number');
    expect(res.forecast[0].condition).toBeDefined();
  });

  it('RoutesAdapter: computes distances and transit times', async () => {
    const res = await RoutesAdapter.calculateRoute(
      'Shibuya Crossing',
      'Shinjuku Gyoen',
      'transit',
      { lat: 35.6595, lng: 139.7005 },
      { lat: 35.685175, lng: 139.710052 }
    );

    expect(res.distanceKm).toBeGreaterThan(0);
    expect(res.durationMinutes).toBeGreaterThan(0);
    expect(res.source).toBeDefined();
  });

  it('CurrencyAdapter: converts currencies with rate precision including INR', async () => {
    const res = await CurrencyAdapter.convert(100, 'USD', 'EUR');
    expect(res.convertedAmount).toBeGreaterThan(0);
    expect(res.rate).toBeGreaterThan(0);

    const inr = await CurrencyAdapter.convert(100, 'USD', 'INR');
    expect(inr.convertedAmount).toBeGreaterThan(7000);
    expect(inr.rate).toBeGreaterThan(70);

    const same = await CurrencyAdapter.convert(50, 'USD', 'USD');
    expect(same.convertedAmount).toBe(50);
    expect(same.rate).toBe(1.0);
  });

  it('AccommodationAdapter: returns realistic lodging suggestions with not_booked status and INR scaling', async () => {
    const stays = await AccommodationAdapter.searchLodging('Tokyo, Japan', 4, 'balanced', 'USD');
    expect(stays.length).toBeGreaterThanOrEqual(2);
    expect(stays[0].nightlyRate).toBeGreaterThan(0);
    expect(stays[0].totalPrice).toBe(stays[0].nightlyRate * 4);
    expect(stays[0].bookingStatus).toBe('not_booked');

    const inrStays = await AccommodationAdapter.searchLodging('New Delhi, India', 3, 'balanced', 'INR');
    expect(inrStays.length).toBeGreaterThanOrEqual(2);
    expect(inrStays[0].currency).toBe('INR');
    expect(inrStays[0].nightlyRate).toBeGreaterThan(5000);
  });
});
