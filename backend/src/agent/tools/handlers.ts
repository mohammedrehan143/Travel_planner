import { PlacesAdapter } from '../../integrations/places.adapter.js';
import { WeatherAdapter } from '../../integrations/weather.adapter.js';
import { RoutesAdapter } from '../../integrations/routes.adapter.js';
import { AccommodationAdapter } from '../../integrations/accommodation.adapter.js';
import { CurrencyAdapter } from '../../integrations/currency.adapter.js';
import { ItineraryValidator } from '../validator.js';
import { getAdminSupabase } from '../../db/supabase.js';
import {
  CompleteItinerary,
  PlannedDay,
  PlannedActivity,
  BudgetBreakdown,
  ValidationReport
} from '../../types/trip.types.js';

export class ToolHandlers {
  /**
   * Tool 1: search_places
   */
  static async searchPlaces(params: {
    query: string;
    destination: string;
    category?: string;
    limit?: number;
  }) {
    return await PlacesAdapter.searchPlaces(
      params.query,
      params.destination,
      params.category,
      params.limit || 10
    );
  }

  /**
   * Tool 2: get_place_details
   */
  static async getPlaceDetails(params: { placeName: string; destination: string }) {
    const details = await PlacesAdapter.getPlaceDetails(params.placeName, params.destination);
    return details || { error: `Place "${params.placeName}" not found in ${params.destination}` };
  }

  /**
   * Tool 3: get_weather_forecast
   */
  static async getWeatherForecast(params: {
    destination: string;
    startDate: string;
    endDate: string;
    lat?: number;
    lng?: number;
  }) {
    return await WeatherAdapter.getForecast(
      params.destination,
      params.startDate,
      params.endDate,
      params.lat,
      params.lng
    );
  }

  /**
   * Tool 4: calculate_route
   */
  static async calculateRoute(params: {
    origin: string;
    destination: string;
    transportMode?: 'walking' | 'driving' | 'transit' | 'cycling';
    originCoords?: { lat: number; lng: number };
    destinationCoords?: { lat: number; lng: number };
  }) {
    return await RoutesAdapter.calculateRoute(
      params.origin,
      params.destination,
      params.transportMode || 'transit',
      params.originCoords,
      params.destinationCoords
    );
  }

  /**
   * Tool 5: check_opening_hours
   */
  static async checkOpeningHours(params: {
    placeName: string;
    destination: string;
    dayOfWeek: string;
    checkTime: string;
  }) {
    const place = await PlacesAdapter.getPlaceDetails(params.placeName, params.destination);
    if (!place) {
      return {
        placeName: params.placeName,
        isOpen: true,
        notice: 'Place details unavailable, assuming standard operational hours.'
      };
    }
    const checkResult = PlacesAdapter.checkOpeningHours(place, params.dayOfWeek, params.checkTime);
    return {
      placeName: place.name,
      dayOfWeek: params.dayOfWeek,
      checkTime: params.checkTime,
      ...checkResult
    };
  }

  /**
   * Tool 6: estimate_trip_budget
   */
  static async estimateTripBudget(params: {
    destination: string;
    durationDays: number;
    travelerCount: number;
    travelStyle: string;
    totalBudget: number;
    currency?: string;
  }): Promise<BudgetBreakdown> {
    const curr = (params.currency || 'USD').toUpperCase();
    const travelers = Math.max(1, params.travelerCount);
    const days = Math.max(1, params.durationDays);
    const nights = Math.max(1, days - 1);

    // Baseline daily cost per person by style
    let nightlyAccommodationPerRoom = 130;
    let dailyFoodPerPerson = 50;
    let dailyActivitiesPerPerson = 40;
    let dailyTransitPerPerson = 15;

    if (params.travelStyle === 'budget' || params.travelStyle === 'backpacking') {
      nightlyAccommodationPerRoom = 45;
      dailyFoodPerPerson = 25;
      dailyActivitiesPerPerson = 20;
      dailyTransitPerPerson = 10;
    } else if (params.travelStyle === 'luxury') {
      nightlyAccommodationPerRoom = 380;
      dailyFoodPerPerson = 140;
      dailyActivitiesPerPerson = 110;
      dailyTransitPerPerson = 45;
    }

    if (curr !== 'USD') {
      try {
        const { rate } = await CurrencyAdapter.convert(1, 'USD', curr);
        if (rate && rate > 0) {
          nightlyAccommodationPerRoom = Math.round(nightlyAccommodationPerRoom * rate);
          dailyFoodPerPerson = Math.round(dailyFoodPerPerson * rate);
          dailyActivitiesPerPerson = Math.round(dailyActivitiesPerPerson * rate);
          dailyTransitPerPerson = Math.round(dailyTransitPerPerson * rate);
        }
      } catch {
        // Fallback to unscaled
      }
    }

    const roomsNeeded = Math.ceil(travelers / 2);
    const totalAccommodation = nightlyAccommodationPerRoom * nights * roomsNeeded;
    const totalFood = dailyFoodPerPerson * days * travelers;
    const totalActivities = dailyActivitiesPerPerson * days * travelers;
    const totalTransport = dailyTransitPerPerson * days * travelers;
    const totalBuffer = Math.round((totalAccommodation + totalFood + totalActivities + totalTransport) * 0.1);

    const estimatedTotalCost = totalAccommodation + totalFood + totalActivities + totalTransport + totalBuffer;
    const surplusOrDeficit = Number((params.totalBudget - estimatedTotalCost).toFixed(2));
    const isWithinBudget = surplusOrDeficit >= 0;

    const symbol = curr === 'INR' ? '₹' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'JPY' ? '¥' : '$';
    const recommendations: string[] = [];
    if (!isWithinBudget) {
      recommendations.push(
        `Budget deficit of ${symbol}${Math.abs(surplusOrDeficit).toLocaleString()} ${curr}. Consider choosing budget-friendly dining or exploring free cultural walking districts.`
      );
    } else {
      recommendations.push(
        `Budget surplus of ${symbol}${surplusOrDeficit.toLocaleString()} ${curr}. Comfortable margin for premium dining and spontaneous experiences.`
      );
    }

    return {
      currency: curr,
      totalBudget: params.totalBudget,
      estimatedTotalCost,
      surplusOrDeficit,
      isWithinBudget,
      categories: {
        accommodation: totalAccommodation,
        transport: totalTransport,
        activities: totalActivities,
        food: totalFood,
        buffer: totalBuffer
      },
      costPerTraveler: Number((estimatedTotalCost / travelers).toFixed(2)),
      recommendations
    };
  }

  /**
   * Tool 7: generate_itinerary
   */
  static async generateItinerary(params: {
    destination: string;
    origin: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    travelerCount: number;
    travelStyle: string;
    interests: string[];
    totalBudget: number;
    currency: string;
  }): Promise<CompleteItinerary> {
    const coords = await PlacesAdapter.getDestinationCoordinates(params.destination);
    const { places } = await PlacesAdapter.searchPlaces('top attractions and restaurants', params.destination, undefined, 20);
    const { forecast } = await WeatherAdapter.getForecast(params.destination, params.startDate, params.endDate, coords.lat, coords.lng);
    const lodging = await AccommodationAdapter.searchLodging(params.destination, Math.max(1, params.durationDays - 1), params.travelStyle, params.currency);
    const budget = await this.estimateTripBudget({
      destination: params.destination,
      durationDays: params.durationDays,
      travelerCount: params.travelerCount,
      travelStyle: params.travelStyle,
      totalBudget: params.totalBudget,
      currency: params.currency
    });

    const currUpper = (params.currency || 'USD').toUpperCase();
    let currencyRate = 1.0;
    if (currUpper !== 'USD') {
      try {
        const { rate } = await CurrencyAdapter.convert(1, 'USD', currUpper);
        if (rate && rate > 0) currencyRate = rate;
      } catch {
        // Fallback to unscaled
      }
    }

    const startDateObj = new Date(params.startDate);
    const days: PlannedDay[] = [];

    // Themes for days
    const themes = [
      { theme: 'Historic Heritage & Old Town Wonders', category: 'cultural' },
      { theme: 'Modern Skyline & Architectural Icons', category: 'sightseeing' },
      { theme: 'Artistic Masterpieces & Bohemian Alleys', category: 'cultural' },
      { theme: 'Culinary Gastronomy & Vibrant Markets', category: 'dining' },
      { theme: 'Scenic Panoramic Views & Serene Gardens', category: 'outdoor' },
      { theme: 'Local Pop Culture & Specialty Boutiques', category: 'entertainment' },
      { theme: 'Leisurely River Walk & Farewell Dinner', category: 'relaxation' }
    ];

    for (let dayIdx = 0; dayIdx < params.durationDays; dayIdx++) {
      const currentDayDate = new Date(startDateObj);
      currentDayDate.setDate(startDateObj.getDate() + dayIdx);
      const dateStr = currentDayDate.toISOString().split('T')[0];
      const themePreset = themes[dayIdx % themes.length];
      const weather = forecast[dayIdx] || forecast[0];

      // Select 3-4 activities for this day
      const dayPlaces = places.slice((dayIdx * 3) % places.length, ((dayIdx * 3) % places.length) + 3);
      if (dayPlaces.length < 3) {
        dayPlaces.push(places[0], places[1]);
      }

      const activities: PlannedActivity[] = [
        {
          title: dayPlaces[0]?.name || `${params.destination} Landmark Discovery`,
          description: dayPlaces[0]?.description || `Morning exploration of top cultural landmarks in ${params.destination}.`,
          category: (dayPlaces[0]?.category as any) || 'cultural',
          startTime: '09:30',
          endTime: '11:30',
          durationMinutes: 120,
          locationName: dayPlaces[0]?.name || `${params.destination} Center`,
          locationAddress: dayPlaces[0]?.address || `Central District, ${params.destination}`,
          latitude: dayPlaces[0]?.lat || coords.lat,
          longitude: dayPlaces[0]?.lng || coords.lng,
          estimatedCost: Math.round((dayPlaces[0]?.estimatedCost || 15) * currencyRate),
          currency: params.currency,
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 1
        },
        {
          title: `Local Flavors & Artisanal Lunch`,
          description: `Savor authentic regional cuisine and local specialties at a vetted neighborhood eatery.`,
          category: 'dining',
          startTime: '12:00',
          endTime: '13:30',
          durationMinutes: 90,
          locationName: `${params.destination} Gourmet Quarter`,
          locationAddress: `Culinary Promenade, ${params.destination}`,
          latitude: coords.lat + 0.002,
          longitude: coords.lng + 0.003,
          estimatedCost: Math.round((params.travelStyle === 'luxury' ? 65 : 25) * currencyRate),
          currency: params.currency,
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 2,
          travelFromPrevious: {
            mode: 'walking',
            durationMinutes: 15,
            distanceKm: 0.8
          }
        },
        {
          title: dayPlaces[1]?.name || `${params.destination} Panorama & Gardens`,
          description: dayPlaces[1]?.description || `Afternoon visit to renowned exhibition spaces and scenic grounds.`,
          category: (dayPlaces[1]?.category as any) || 'sightseeing',
          startTime: '14:30',
          endTime: '17:00',
          durationMinutes: 150,
          locationName: dayPlaces[1]?.name || `${params.destination} Gardens`,
          locationAddress: dayPlaces[1]?.address || `Parkway, ${params.destination}`,
          latitude: dayPlaces[1]?.lat || coords.lat - 0.003,
          longitude: dayPlaces[1]?.lng || coords.lng + 0.004,
          estimatedCost: Math.round((dayPlaces[1]?.estimatedCost || 18) * currencyRate),
          currency: params.currency,
          bookingRequired: dayPlaces[1]?.priceLevel ? dayPlaces[1].priceLevel > 2 : false,
          bookingStatus: 'not_booked',
          orderIndex: 3,
          travelFromPrevious: {
            mode: 'transit',
            durationMinutes: 20,
            distanceKm: 2.4
          }
        },
        {
          title: `Sunset Stroll & Evening Highlights`,
          description: `Unwind with twilight ambiance, scenic illumination, and evening beverages.`,
          category: 'relaxation',
          startTime: '18:00',
          endTime: '20:00',
          durationMinutes: 120,
          locationName: `${params.destination} Waterfront Promenade`,
          locationAddress: `Boulevard Vista, ${params.destination}`,
          latitude: coords.lat + 0.004,
          longitude: coords.lng - 0.002,
          estimatedCost: Math.round(20 * currencyRate),
          currency: params.currency,
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 4,
          travelFromPrevious: {
            mode: 'walking',
            durationMinutes: 15,
            distanceKm: 1.1
          }
        }
      ];

      const dayCost = activities.reduce((sum, a) => sum + a.estimatedCost, 0);

      days.push({
        dayNumber: dayIdx + 1,
        date: dateStr,
        theme: themePreset.theme,
        summary: `Day ${dayIdx + 1} focuses on ${themePreset.theme.toLowerCase()} in ${params.destination}. Expected weather: ${weather?.condition || 'Fair'} (${weather?.temperatureMaxC || 20}°C).`,
        weatherSummary: weather,
        activities,
        dayEstimatedCost: dayCost
      });
    }

    return {
      title: `${params.destination} ${params.travelStyle.charAt(0).toUpperCase() + params.travelStyle.slice(1)} Discovery`,
      description: `A thoughtfully balanced ${params.durationDays}-day travel itinerary from ${params.origin} to ${params.destination}, tailored for ${params.travelerCount} traveler(s).`,
      destination: params.destination,
      origin: params.origin,
      startDate: params.startDate,
      endDate: params.endDate,
      durationDays: params.durationDays,
      travelerCount: params.travelerCount,
      travelStyle: params.travelStyle as any,
      interests: params.interests,
      totalBudget: params.totalBudget,
      currency: params.currency,
      destinationCoordinates: coords,
      days,
      accommodationSuggestions: lodging.map(l => ({
        name: l.name,
        type: l.type,
        address: l.address,
        estimatedNightlyRate: l.nightlyRate,
        totalPrice: l.totalPrice,
        rating: l.rating,
        latitude: l.latitude,
        longitude: l.longitude
      })),
      budgetBreakdown: budget,
      packingList: [
        'Comfortable walking shoes',
        'Universal power adapter and power bank',
        'Lightweight weather-proof jacket',
        'Reusable water bottle',
        'Transit IC card or travel pass'
      ],
      localTips: [
        'Pre-book high-demand museums at least 3-5 days in advance.',
        'Carry a small amount of local currency for small vendors and transit tickets.',
        'Keep emergency embassy and hotel contacts saved offline.'
      ]
    };
  }

  /**
   * Tool 8: validate_itinerary
   */
  static validateItinerary(params: {
    totalBudget: number;
    currency?: string;
    days: PlannedDay[];
  }): ValidationReport {
    const totalActivitiesCost = params.days.reduce(
      (sum, d) => sum + d.activities.reduce((s, a) => s + (a.estimatedCost || 0), 0),
      0
    );
    return ItineraryValidator.validate(params.days, params.totalBudget, totalActivitiesCost);
  }

  /**
   * Tool 9: update_trip
   */
  static async updateTrip(params: { tripId: string; updates: Record<string, any> }) {
    try {
      const supabase = getAdminSupabase();
      const { data, error } = await (supabase.from('trips') as any)
        .update(params.updates)
        .eq('id', params.tripId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, updatedTrip: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Tool 10: save_trip
   */
  static async saveTrip(params: { userId: string; itinerary: CompleteItinerary }) {
    try {
      const supabase = getAdminSupabase();
      const itin = params.itinerary;

      // 1. Insert Trip
      const { data: tripData, error: tripError } = await (supabase.from('trips') as any)
        .insert({
          user_id: params.userId,
          title: itin.title,
          description: itin.description,
          origin: itin.origin,
          destination: itin.destination,
          start_date: itin.startDate,
          end_date: itin.endDate,
          duration_days: itin.durationDays,
          traveler_count: itin.travelerCount,
          travel_style: itin.travelStyle,
          interests: itin.interests,
          total_budget: itin.totalBudget,
          currency: itin.currency,
          status: 'planning',
          destination_lat: itin.destinationCoordinates?.lat,
          destination_lng: itin.destinationCoordinates?.lng
        })
        .select()
        .single();

      if (tripError || !tripData) {
        return {
          success: false,
          error: tripError?.message || 'Failed to insert trip row',
          itinerary: itin
        };
      }

      const tripId = tripData.id;

      // 2. Insert Days and Activities
      for (const day of itin.days) {
        const { data: dayData, error: dayError } = await (supabase.from('trip_days') as any)
          .insert({
            trip_id: tripId,
            day_number: day.dayNumber,
            date: day.date,
            theme: day.theme,
            summary: day.summary,
            weather_summary: (day.weatherSummary as any) || null
          })
          .select()
          .single();

        if (dayData && !dayError) {
          const activitiesToInsert = day.activities.map((a, idx) => ({
            trip_id: tripId,
            trip_day_id: dayData.id,
            title: a.title,
            description: a.description,
            category: a.category,
            start_time: a.startTime,
            end_time: a.endTime,
            duration_minutes: a.durationMinutes,
            location_name: a.locationName,
            location_address: a.locationAddress,
            latitude: a.latitude,
            longitude: a.longitude,
            estimated_cost: a.estimatedCost,
            currency: a.currency || itin.currency,
            booking_required: a.bookingRequired,
            booking_status: a.bookingStatus || 'not_booked',
            notes: a.notes,
            order_index: a.orderIndex || idx + 1
          }));

          await (supabase.from('activities') as any).insert(activitiesToInsert as any);
        }
      }

      // 3. Insert Accommodations
      if (itin.accommodationSuggestions && itin.accommodationSuggestions.length > 0) {
        const primaryStay = itin.accommodationSuggestions[0];
        await (supabase.from('accommodations') as any).insert({
          trip_id: tripId,
          name: primaryStay.name,
          type: primaryStay.type,
          address: primaryStay.address,
          check_in_date: itin.startDate,
          check_out_date: itin.endDate,
          total_price: primaryStay.totalPrice,
          currency: itin.currency,
          latitude: primaryStay.latitude,
          longitude: primaryStay.longitude,
          rating: primaryStay.rating,
          booking_status: 'not_booked'
        } as any);
      }

      return {
        success: true,
        tripId,
        message: 'Itinerary, days, activities, and accommodation successfully saved.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        itinerary: params.itinerary
      };
    }
  }
}
