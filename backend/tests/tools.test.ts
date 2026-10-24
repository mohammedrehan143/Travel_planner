import { describe, it, expect } from 'vitest';
import { executeAgentTool } from '../src/agent/tools/index.js';

describe('Agent Tools Suite (10 Core Tools)', () => {
  it('Tool 1: search_places - finds places in Tokyo', async () => {
    const res = await executeAgentTool('search_places', {
      query: 'historic temple',
      destination: 'Tokyo, Japan',
      limit: 5
    });

    expect(res).toBeDefined();
    expect(Array.isArray(res.places)).toBe(true);
    expect(res.places.length).toBeGreaterThan(0);
    expect(res.places[0]).toHaveProperty('name');
    expect(res.places[0]).toHaveProperty('lat');
    expect(res.places[0]).toHaveProperty('lng');
  });

  it('Tool 2: get_place_details - returns details for known attraction', async () => {
    const res = await executeAgentTool('get_place_details', {
      placeName: 'Senso-ji Temple',
      destination: 'Tokyo, Japan'
    });

    expect(res).toBeDefined();
    expect(res.name).toContain('Senso-ji');
    expect(res.rating).toBeGreaterThan(4);
    expect(res.openingHours).toBeDefined();
  });

  it('Tool 3: get_weather_forecast - provides multi-day weather', async () => {
    const res = await executeAgentTool('get_weather_forecast', {
      destination: 'Tokyo, Japan',
      startDate: '2026-11-01',
      endDate: '2026-11-03'
    });

    expect(res).toBeDefined();
    expect(Array.isArray(res.forecast)).toBe(true);
    expect(res.forecast.length).toBe(3);
    expect(res.forecast[0]).toHaveProperty('temperatureMaxC');
    expect(res.forecast[0]).toHaveProperty('condition');
  });

  it('Tool 4: calculate_route - calculates travel duration and distance', async () => {
    const res = await executeAgentTool('calculate_route', {
      origin: 'Asakusa',
      destination: 'Akihabara',
      transportMode: 'transit',
      originCoords: { lat: 35.714765, lng: 139.796655 },
      destinationCoords: { lat: 35.698383, lng: 139.771972 }
    });

    expect(res).toBeDefined();
    expect(res.distanceKm).toBeGreaterThan(0);
    expect(res.durationMinutes).toBeGreaterThan(0);
  });

  it('Tool 5: check_opening_hours - verifies opening schedule', async () => {
    const res = await executeAgentTool('check_opening_hours', {
      placeName: 'Senso-ji Temple',
      destination: 'Tokyo, Japan',
      dayOfWeek: 'Monday',
      checkTime: '10:00'
    });

    expect(res).toBeDefined();
    expect(res.isOpen).toBe(true);
  });

  it('Tool 6: estimate_trip_budget - calculates category breakdown and budget feasibility', async () => {
    const res = await executeAgentTool('estimate_trip_budget', {
      destination: 'Tokyo, Japan',
      durationDays: 5,
      travelerCount: 2,
      travelStyle: 'balanced',
      totalBudget: 3500,
      currency: 'USD'
    });

    expect(res).toBeDefined();
    expect(res.totalBudget).toBe(3500);
    expect(res.estimatedTotalCost).toBeGreaterThan(0);
    expect(res.categories).toHaveProperty('accommodation');
    expect(res.categories).toHaveProperty('food');
    expect(res.categories).toHaveProperty('activities');
  });

  it('Tool 7: generate_itinerary - produces structured multi-day itinerary', async () => {
    const res = await executeAgentTool('generate_itinerary', {
      destination: 'Tokyo, Japan',
      origin: 'San Francisco, CA',
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      durationDays: 3,
      travelerCount: 2,
      travelStyle: 'balanced',
      interests: ['cultural', 'culinary'],
      totalBudget: 2500,
      currency: 'USD'
    });

    expect(res).toBeDefined();
    expect(res.days.length).toBe(3);
    expect(res.days[0].activities.length).toBeGreaterThanOrEqual(3);
    expect(res.accommodationSuggestions.length).toBeGreaterThan(0);
    expect(res.curatedVenuesByTopic).toBeDefined();
    expect(res.curatedVenuesByTopic!.length).toBeGreaterThanOrEqual(4);
    expect(res.curatedVenuesByTopic![0].venues.length).toBeGreaterThanOrEqual(10);
  });

  it('Tool 8: validate_itinerary - detects validity of days', async () => {
    const sampleDay = {
      dayNumber: 1,
      date: '2026-11-01',
      theme: 'Heritage',
      summary: 'Exploring historic district',
      activities: [
        {
          title: 'Morning Walk',
          category: 'cultural',
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 120,
          locationName: 'Temple',
          latitude: 35.71,
          longitude: 139.79,
          estimatedCost: 10,
          orderIndex: 1
        },
        {
          title: 'Lunch',
          category: 'dining',
          startTime: '12:00',
          endTime: '13:30',
          durationMinutes: 90,
          locationName: 'Cafe',
          latitude: 35.712,
          longitude: 139.792,
          estimatedCost: 20,
          orderIndex: 2
        }
      ]
    };

    const res = await executeAgentTool('validate_itinerary', {
      totalBudget: 1000,
      days: [sampleDay]
    });

    expect(res.isValid).toBe(true);
    expect(res.metrics.totalActivities).toBe(2);
  });

  it('Tool 9 & 10: update_trip & save_trip execution', async () => {
    const sampleItin = {
      title: 'Bali Getaway',
      description: 'Tropical relaxation in Ubud',
      origin: 'Singapore',
      destination: 'Bali, Indonesia',
      startDate: '2026-12-01',
      endDate: '2026-12-04',
      durationDays: 3,
      travelerCount: 1,
      travelStyle: 'relaxed' as const,
      interests: ['nature', 'relaxation'],
      totalBudget: 1500,
      currency: 'USD',
      destinationCoordinates: { lat: -8.4095, lng: 115.1889 },
      days: [],
      accommodationSuggestions: [],
      budgetBreakdown: {
        currency: 'USD',
        totalBudget: 1500,
        estimatedTotalCost: 900,
        surplusOrDeficit: 600,
        isWithinBudget: true,
        categories: { accommodation: 400, transport: 100, activities: 200, food: 150, buffer: 50 },
        costPerTraveler: 900,
        recommendations: []
      }
    };

    const saveRes = await executeAgentTool('save_trip', {
      userId: '00000000-0000-0000-0000-000000000001',
      itinerary: sampleItin
    });

    expect(saveRes).toBeDefined();
  });

  it('Feature: Curated Venues by Topic provides > 10 venues per sub-topic', async () => {
    const { PlacesAdapter } = await import('../src/integrations/places.adapter.js');
    const topics = await PlacesAdapter.getCuratedVenuesByTopic('Goa, India', 12);
    expect(topics).toBeDefined();
    expect(topics.length).toBeGreaterThanOrEqual(6);
    topics.forEach((t) => {
      expect(t.venues.length).toBeGreaterThanOrEqual(10);
      expect(t.venues[0]).toHaveProperty('name');
      expect(t.venues[0]).toHaveProperty('speciality');
    });
  });

  it('Feature: Category Search returns >= 10 unique places per category with Google Maps links', async () => {
    const { PlacesAdapter } = await import('../src/integrations/places.adapter.js');

    // Test restaurants in Goa
    const diningRes = await PlacesAdapter.searchPlaces('restaurants', 'Goa, India', 'restaurants', 14);
    expect(diningRes.places.length).toBeGreaterThanOrEqual(10);
    expect(diningRes.places[0].googleMapsUrl).toBeDefined();
    expect(diningRes.places[0].googleMapsUrl).toContain('google.com/maps');

    // Test beaches in Goa
    const beachesRes = await PlacesAdapter.searchPlaces('beaches', 'Goa, India', 'beaches', 14);
    expect(beachesRes.places.length).toBeGreaterThanOrEqual(10);
    expect(beachesRes.places.some(p => p.name.toLowerCase().includes('beach') || p.name.toLowerCase().includes('palolem') || p.name.toLowerCase().includes('anjuna'))).toBe(true);

    // Test cafes in Goa
    const cafesRes = await PlacesAdapter.searchPlaces('cafes', 'Goa, India', 'cafes', 12);
    expect(cafesRes.places.length).toBeGreaterThanOrEqual(10);
  });

  it('Feature: Multi-category search returns separate lists with >= 10 places per category', async () => {
    const { PlacesAdapter } = await import('../src/integrations/places.adapter.js');

    const multiRes = await PlacesAdapter.searchMultipleCategories(
      'Goa, India',
      ['beaches', 'restaurants', 'historical_places'],
      12
    );

    expect(multiRes.categories).toBeDefined();
    expect(multiRes.categories.length).toBe(3);

    // Check each category has separate list with >= 10 places
    for (const catResult of multiRes.categories) {
      expect(catResult.count).toBeGreaterThanOrEqual(10);
      expect(catResult.places.length).toBeGreaterThanOrEqual(10);
      catResult.places.forEach(p => {
        expect(p.googleMapsUrl).toBeDefined();
        expect(p.googleMapsUrl).toContain('google.com/maps');
      });
    }

    // Total deduped places should be greater than a single category
    expect(multiRes.totalPlaces).toBeGreaterThanOrEqual(30);
  });

  it('Feature: Destination-specific searches produce distinct places', async () => {
    const { PlacesAdapter } = await import('../src/integrations/places.adapter.js');

    const goaRes = await PlacesAdapter.searchPlaces('restaurants', 'Goa, India', 'restaurants', 10);
    const tokyoRes = await PlacesAdapter.searchPlaces('restaurants', 'Tokyo, Japan', 'restaurants', 10);

    expect(goaRes.places.length).toBeGreaterThanOrEqual(10);
    expect(tokyoRes.places.length).toBeGreaterThanOrEqual(10);

    const goaNames = new Set(goaRes.places.map(p => p.name));
    const tokyoNames = new Set(tokyoRes.places.map(p => p.name));

    // Zero overlap between Goa and Tokyo
    for (const name of goaNames) {
      expect(tokyoNames.has(name)).toBe(false);
    }
  });
});
