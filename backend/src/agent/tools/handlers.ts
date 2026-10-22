import { PlacesAdapter } from '../../integrations/places.adapter.js';
import { WeatherAdapter } from '../../integrations/weather.adapter.js';
import { RoutesAdapter } from '../../integrations/routes.adapter.js';
import { AccommodationAdapter } from '../../integrations/accommodation.adapter.js';
import { CurrencyAdapter } from '../../integrations/currency.adapter.js';
import { generateItineraryWithGemini } from '../gemini.generator.js';
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
    const nights = days <= 1 ? 0 : days - 1;

    // Baseline daily cost per person by style
    let nightlyAccommodationPerRoom = nights > 0 ? 130 : 0;
    let dailyFoodPerPerson = 50;
    let dailyActivitiesPerPerson = 40;
    let dailyTransitPerPerson = 15;

    if (days === 1) {
      dailyFoodPerPerson = 15;
      dailyActivitiesPerPerson = 10;
      dailyTransitPerPerson = 5;
    } else if (params.travelStyle === 'budget' || params.travelStyle === 'backpacking') {
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
    travelCompanion?: string;
    travelStyle: string;
    interests: string[];
    totalBudget: number;
    currency: string;
  }): Promise<CompleteItinerary> {
    const coords = await PlacesAdapter.getDestinationCoordinates(params.destination);
    const nights = params.durationDays <= 1 ? 0 : params.durationDays - 1;
    const lodging = nights > 0
      ? await AccommodationAdapter.searchLodging(params.destination, nights, params.travelStyle, params.currency)
      : [];
    const budget = await this.estimateTripBudget({
      destination: params.destination,
      durationDays: params.durationDays,
      travelerCount: params.travelerCount,
      travelStyle: params.travelStyle,
      totalBudget: params.totalBudget,
      currency: params.currency
    });

    // 1. Attempt Gemini Generation First for Authentic Real-World Places in the Requested Destination
    try {
      const geminiResult = await generateItineraryWithGemini({
        destination: params.destination,
        origin: params.origin,
        startDate: params.startDate,
        endDate: params.endDate,
        durationDays: params.durationDays,
        travelerCount: params.travelerCount,
        travelCompanion: params.travelCompanion,
        travelStyle: params.travelStyle,
        interests: params.interests,
        totalBudget: params.totalBudget,
        currency: params.currency,
        dietaryPreference: (params as any).dietaryPreference,
        coords
      });

      if (geminiResult && geminiResult.days && geminiResult.days.length > 0) {
        return {
          title: geminiResult.theme ? `${params.destination}: ${geminiResult.theme}` : `${params.destination} Agentic Blueprint`,
          description: geminiResult.summary || `Curated itinerary planned with Google Gemini for ${params.destination}.`,
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
          days: geminiResult.days,
          flightEstimate: geminiResult.flightEstimate,
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
            'Transit pass or local navigation app'
          ],
          localTips: [
            `Verify opening hours and booking availability for popular sites in ${params.destination}.`,
            `Keep local emergency contacts and offline maps downloaded.`,
            `Use recommended digital payment cards or modest amounts of cash in ${params.currency}.`
          ]
        };
      }
    } catch (err) {
      console.warn('Gemini itinerary generation fallback to heuristic places adapter:', err);
    }

    const { places } = await PlacesAdapter.searchPlaces('attractions', params.destination, undefined, 20);
    const { forecast } = await WeatherAdapter.getForecast(params.destination, params.startDate, params.endDate, coords.lat, coords.lng);

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

    // Realistic Flight Ticket Charges Estimation
    const origLower = (params.origin || '').toLowerCase();
    const destLower = (params.destination || '').toLowerCase();
    const isSameCity =
      origLower.includes(destLower) ||
      destLower.includes(origLower) ||
      (origLower.includes('bangalore') && destLower.includes('bangalore')) ||
      (origLower.includes('bengaluru') && destLower.includes('bengaluru')) ||
      (origLower.includes('riyadh') && destLower.includes('riyadh'));

    let flightCost = 0;
    let flightAirlines = 'Intra-City Traveling (No Flight Needed)';
    let flightDesc = 'Local traveling only — zero flight ticket expense';

    if (!isSameCity) {
      if (destLower.includes('saudi') || origLower.includes('saudi')) {
        flightCost = Math.round(340 * currencyRate);
        flightAirlines = 'Saudia / Emirates / Air India';
        flightDesc = 'Estimated round-trip international flight ticket fare per passenger';
      } else if (
        destLower.includes('paris') ||
        destLower.includes('tokyo') ||
        destLower.includes('new york') ||
        destLower.includes('london')
      ) {
        flightCost = Math.round(780 * currencyRate);
        flightAirlines = 'Commercial Airlines (Air France, ANA, British Airways)';
        flightDesc = 'Estimated round-trip long-haul international airfare';
      } else {
        // Domestic intercity flight
        flightCost = Math.round(75 * currencyRate);
        flightAirlines = 'IndiGo / Air India / Domestic Carrier';
        flightDesc = 'Estimated domestic intercity round-trip airfare per person';
      }
    }

    const startDateObj = new Date(params.startDate);
    const days: PlannedDay[] = [];

    // Themes without generic sunrise/sunset cliches
    const themes = [
      { theme: 'Historic Heritage & Architectural Masterpieces', category: 'cultural' },
      { theme: 'Iconic Landmarks & Famous Hangout Spots', category: 'sightseeing' },
      { theme: 'Authentic Specialities & Vibrant Local Markets', category: 'dining' },
      { theme: 'Scenic Botanical Panoramas & Cultural Alleys', category: 'outdoor' },
      { theme: 'Urban Culture & Celebrated Gathering Hubs', category: 'entertainment' }
    ];

    const isBlr = destLower.includes('bangalore') || destLower.includes('bengaluru');
    const isSaudi = destLower.includes('saudi') || destLower.includes('riyadh');
    const dietaryChoice = ((params as any).dietaryPreference || 'any').toLowerCase();

    for (let dayIdx = 0; dayIdx < params.durationDays; dayIdx++) {
      const currentDayDate = new Date(startDateObj);
      currentDayDate.setDate(startDateObj.getDate() + dayIdx);
      const dateStr = currentDayDate.toISOString().split('T')[0];
      const themePreset = themes[dayIdx % themes.length];
      const weather = forecast[dayIdx] || forecast[0];

      // Provide AT LEAST 4 to 5 rich places per day with distinct specialities and hangout spots
      const activities: PlannedActivity[] = [
        // 1. Morning Landmark / Heritage Sight
        {
          title: isBlr
            ? 'Bangalore Palace & Tudor Heritage Grounds'
            : isSaudi
            ? 'Kingdom Centre Sky Bridge Observation'
            : places[0]?.name || `${params.destination} Historic Landmark`,
          description: isBlr
            ? 'Explore 19th-century Tudor-style royal architecture, ornate wood carvings, and expansive gardens.'
            : isSaudi
            ? 'Ascend 300 meters above Riyadh for unhindered 360-degree vistas across the Arabian capital.'
            : places[0]?.description || `Morning exploration of top cultural landmarks in ${params.destination}.`,
          category: isSaudi ? 'sightseeing' : 'cultural',
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 120,
          locationName: isBlr ? 'Bangalore Palace' : isSaudi ? 'Kingdom Centre Tower' : places[0]?.name || `${params.destination} Center`,
          locationAddress: isBlr ? 'Vasanth Nagar, Bengaluru' : isSaudi ? 'Al Olaya, Riyadh, Saudi Arabia' : places[0]?.address || `Central District, ${params.destination}`,
          latitude: isBlr ? 12.9988 : isSaudi ? 24.7114 : places[0]?.lat || coords.lat,
          longitude: isBlr ? 77.5921 : isSaudi ? 46.6744 : places[0]?.lng || coords.lng,
          estimatedCost: Math.round((places[0]?.estimatedCost || (isBlr ? 250 : 69)) * (isBlr ? 1 : currencyRate)),
          currency: params.currency,
          speciality: isBlr ? 'Royal Tudor Woodcarvings & Durbar Hall' : isSaudi ? '300m Curved Glass Skybridge Panorama' : 'Heritage Architecture & Exhibits',
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 1,
          travelFromPrevious: undefined
        },
        // 2. Midday Culinary Spot with Veg / Non-Veg Speciality
        {
          title: isBlr
            ? dietaryChoice === 'veg'
              ? 'Vidyarthi Bhavan - Legendary Ghee Masala Dosa'
              : 'Meghana Foods - Signature Andhra Dum Biryani'
            : isSaudi
            ? 'Najd Village - Authentic Saudi Heritage Feast'
            : `Artisanal Regional Dining & Local Specialities`,
          description: isBlr
            ? dietaryChoice === 'veg'
              ? 'Century-old vegetarian institution renowned for thick crispy butter masala dosas and frothy filter coffee.'
              : 'Renowned destination for fiery Andhra-style boneless chicken biryani and chilli chicken.'
            : isSaudi
            ? 'Traditional Najdi heritage courtyard dining serving aromatic kabsa, lamb hashi, and cardamom saffron tea.'
            : `Savor authentic regional cuisine and local specialties prepared according to vetted recipes.`,
          category: 'dining',
          startTime: '11:30',
          endTime: '13:00',
          durationMinutes: 90,
          locationName: isBlr
            ? dietaryChoice === 'veg' ? 'Vidyarthi Bhavan' : 'Meghana Foods'
            : isSaudi ? 'Najd Village Restaurant' : `${params.destination} Gourmet Quarter`,
          locationAddress: isBlr
            ? dietaryChoice === 'veg' ? 'Gandhi Bazaar, Basavanagudi, Bengaluru' : 'Koramangala 5th Block, Bengaluru'
            : isSaudi ? 'Al Olaya, Riyadh, Saudi Arabia' : `Culinary Quarter, ${params.destination}`,
          latitude: coords.lat + 0.002,
          longitude: coords.lng + 0.003,
          estimatedCost: Math.round((isBlr ? (dietaryChoice === 'veg' ? 180 : 350) : 35) * (isBlr ? 1 : currencyRate)),
          currency: params.currency,
          dietaryTag: isBlr ? (dietaryChoice === 'veg' ? 'veg' : 'non-veg') : 'both',
          speciality: isBlr
            ? dietaryChoice === 'veg' ? 'Crispy Ghee Butter Dosa & Filter Kaapi' : 'Spicy Andhra Dum Biryani & Chilli Chicken'
            : isSaudi ? 'Aromatic Lamb Kabsa & Cardamom Saffron Qahwa' : 'Signature Local Culinary Specialties',
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 2,
          travelFromPrevious: {
            mode: 'walking',
            durationMinutes: 15,
            distanceKm: 1.0
          }
        },
        // 3. Afternoon Cultural & Nature Exploration
        {
          title: isBlr
            ? 'Lalbagh Glass House & Botanical Gardens'
            : isSaudi
            ? 'Historic Diriyah (At-Turaif UNESCO World Heritage Site)'
            : places[1]?.name || `${params.destination} Gardens & Panorama`,
          description: isBlr
            ? 'Stroll through 240 acres of century-old tropical flora, tranquil lotus ponds, and the Victorian glass pavilion.'
            : isSaudi
            ? 'Wander the restored mud-brick alleys, palaces, and atmospheric desert courtyards of the first Saudi state.'
            : places[1]?.description || `Afternoon visit to renowned exhibition spaces and scenic grounds.`,
          category: isBlr ? 'outdoor' : 'cultural',
          startTime: '13:30',
          endTime: '15:30',
          durationMinutes: 120,
          locationName: isBlr ? 'Lalbagh Botanical Garden' : isSaudi ? 'At-Turaif District, Diriyah' : places[1]?.name || `${params.destination} Gardens`,
          locationAddress: isBlr ? 'Mavalli, Bengaluru' : isSaudi ? 'Diriyah, Riyadh, Saudi Arabia' : places[1]?.address || `Parkway, ${params.destination}`,
          latitude: isBlr ? 12.9507 : isSaudi ? 24.7337 : places[1]?.lat || coords.lat - 0.003,
          longitude: isBlr ? 77.5848 : isSaudi ? 46.5752 : places[1]?.lng || coords.lng + 0.004,
          estimatedCost: Math.round((isBlr ? 30 : 50) * (isBlr ? 1 : currencyRate)),
          currency: params.currency,
          speciality: isBlr ? '1889 Victorian Crystal Glass House & Bonsai Garden' : isSaudi ? 'Najdi Mud-Brick Citadel & UNESCO Alleys' : 'Panoramic Grounds',
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 3,
          travelFromPrevious: {
            mode: 'transit',
            durationMinutes: 20,
            distanceKm: 2.5
          }
        },
        // 4. Late Afternoon Famous Local Hangout Spot
        {
          title: isBlr
            ? 'Church Street & Blossoms Book House Cultural Hangout'
            : isSaudi
            ? 'Boulevard Riyadh City Dancing Fountains'
            : `${params.destination} Vibrant Promenade & Artisan Cafes`,
          description: isBlr
            ? 'Bangalore favorite bohemian hangout: browse 3 floors of vintage books, sip specialty roasts, and people-watch on Church Street.'
            : isSaudi
            ? 'Popular open-air gathering hub featuring dancing music fountains, open-air cafes, boutique shops, and lighted walkways.'
            : `Soak in the local lifestyle at the city's most beloved gathering plaza and cafe strip.`,
          category: 'relaxation',
          startTime: '16:00',
          endTime: '17:30',
          durationMinutes: 90,
          locationName: isBlr ? 'Church Street & Blossoms' : isSaudi ? 'Boulevard Riyadh City' : `${params.destination} Hangout Strip`,
          locationAddress: isBlr ? 'Church Street, Shanthala Nagar, Bengaluru' : isSaudi ? 'Hittin, Riyadh, Saudi Arabia' : `Promenade, ${params.destination}`,
          latitude: coords.lat + 0.003,
          longitude: coords.lng - 0.002,
          estimatedCost: Math.round((isBlr ? 150 : 25) * (isBlr ? 1 : currencyRate)),
          currency: params.currency,
          speciality: isBlr ? 'Old Book Browsing & Bangalore Indie Cafe Culture' : isSaudi ? 'Illuminated Dancing Fountains & Luxury Cafes' : 'Local Artisan Coffee & Atmosphere',
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 4,
          travelFromPrevious: {
            mode: 'walking',
            durationMinutes: 15,
            distanceKm: 1.2
          }
        },
        // 5. Evening Food Street / Vibrant Social Experience
        {
          title: isBlr
            ? dietaryChoice === 'veg'
              ? 'VV Puram Food Street (Thindi Beedi) Evening Feast'
              : 'Shivaji Military Hotel - Woodfire Mutton Donne Biryani'
            : isSaudi
            ? 'Souq Al Zal Evening Antiques & Perfume Market'
            : `${params.destination} Evening Night Market & Speciality Dining`,
          description: isBlr
            ? dietaryChoice === 'veg'
              ? 'Gourmet street-food crawl through Bangalore legendary Thindi Beedi: hot paddus, butter benne dosas, Congress buns, and jalebis.'
              : 'Authentic 1924 military hotel serving tender mutton donne biryani slow-cooked over charcoal with chicken sukka.'
            : isSaudi
            ? 'Riyadh oldest traditional marketplace filled with authentic oud incense, amber beads, handwoven rugs, and local spices.'
            : `Experience the vibrant evening social scene and sample celebrated local delicacies.`,
          category: isSaudi ? 'shopping' : 'dining',
          startTime: '18:00',
          endTime: '20:00',
          durationMinutes: 120,
          locationName: isBlr
            ? dietaryChoice === 'veg' ? 'VV Puram Food Street' : 'Shivaji Military Hotel'
            : isSaudi ? 'Souq Al Zal' : `${params.destination} Night Hub`,
          locationAddress: isBlr
            ? dietaryChoice === 'veg' ? 'Old Tharagupet, Bengaluru' : '8th Block, Jayanagar, Bengaluru'
            : isSaudi ? 'Al Dirah, Riyadh, Saudi Arabia' : `Boulevard, ${params.destination}`,
          latitude: coords.lat - 0.002,
          longitude: coords.lng + 0.002,
          estimatedCost: Math.round((isBlr ? 200 : 30) * (isBlr ? 1 : currencyRate)),
          currency: params.currency,
          dietaryTag: isBlr ? (dietaryChoice === 'veg' ? 'veg' : 'non-veg') : 'both',
          speciality: isBlr
            ? dietaryChoice === 'veg' ? 'Hot Paddus, Congress Buns & Davangere Benne Dosa' : 'Heritage Charcoal Mutton Donne Biryani'
            : isSaudi ? 'Rare Oud Incense & Heritage Arabian Crafts' : 'Evening Street Delicacies',
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 5,
          travelFromPrevious: {
            mode: 'transit',
            durationMinutes: 15,
            distanceKm: 1.8
          }
        }
      ];

      const dayCost = activities.reduce((sum, a) => sum + a.estimatedCost, 0);

      days.push({
        dayNumber: dayIdx + 1,
        date: dateStr,
        theme: themePreset.theme,
        summary: `Day ${dayIdx + 1} highlights ${themePreset.theme.toLowerCase()} across ${params.destination}. Weather: ${weather?.condition || 'Pleasant'} (${weather?.temperatureMaxC || 24}°C).`,
        weatherSummary: weather,
        activities,
        dayEstimatedCost: dayCost
      });
    }

    return {
      title: `${params.destination} ${params.travelStyle.charAt(0).toUpperCase() + params.travelStyle.slice(1)} Discovery`,
      description: `A thoughtfully curated ${params.durationDays}-day travel itinerary from ${params.origin} to ${params.destination}, planned for ${params.travelerCount} traveler(s) with local specialities.`,
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
      flightEstimate: {
        estimatedCost: flightCost,
        currency: params.currency,
        airlines: flightAirlines,
        description: flightDesc
      },
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
        'Transit pass or local navigation app'
      ],
      localTips: [
        `Verify opening hours and booking availability for popular sites in ${params.destination}.`,
        `Keep local emergency contacts and offline maps downloaded.`,
        `Use recommended digital payment cards or modest amounts of cash in ${params.currency}.`
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
          const activitiesToInsert = day.activities.map((a, idx) => {
            const extraNotes = [
              a.speciality ? `Speciality: ${a.speciality}` : '',
              a.dietaryTag ? `Dietary: ${a.dietaryTag}` : '',
              a.notes || ''
            ].filter(Boolean).join(' • ');

            return {
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
              notes: extraNotes || null,
              order_index: a.orderIndex || idx + 1
            };
          });

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
