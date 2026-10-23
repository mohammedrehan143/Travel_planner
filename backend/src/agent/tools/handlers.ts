import { PlacesAdapter } from '../../integrations/places.adapter.js';
import { WeatherAdapter } from '../../integrations/weather.adapter.js';
import { RoutesAdapter } from '../../integrations/routes.adapter.js';
import { AccommodationAdapter } from '../../integrations/accommodation.adapter.js';
import { CurrencyAdapter } from '../../integrations/currency.adapter.js';
import { generateItineraryWithGemini } from '../gemini.generator.js';
import { getAccurateFlightEstimate } from '../flightPricing.js';
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

    // Accurate Flight Ticket Charges Estimation
    const accurateFlightEstimate = getAccurateFlightEstimate(
      params.origin,
      params.destination,
      params.currency
    );
    const flightCost = accurateFlightEstimate.cost;
    const flightAirlines = accurateFlightEstimate.airlines;
    const flightDesc = accurateFlightEstimate.description;

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

    const dietaryChoice = ((params as any).dietaryPreference || 'any').toLowerCase();

    // Helper for destination-specific dining
    const getDiningForDest = (dest: string, dietary: string, dIdx: number) => {
      const d = dest.toLowerCase();
      if (d.includes('goa')) {
        return dietary === 'veg'
          ? {
              title: dIdx === 0 ? 'Bhakti Pure Veg & Coastal Cafe' : 'Vinayak Local Kitchen - Veg Thali',
              desc: 'Traditional Goan vegetarian dishes including fragrant coconut Sol Kadhi, spiced Vegetable Xacuti, and hot poi bread.',
              location: 'Assagao, Goa',
              speciality: 'Sol Kadhi & Goan Vegetable Xacuti',
              cost: 220
            }
          : {
              title: dIdx === 0 ? 'Vinayak Family Restaurant - Authentic Goan Fish Curry' : 'Fisherman\'s Wharf - Riverside Seafood Feast',
              desc: 'Celebrated local tavern famous for crispy rava fried kingfish, butter garlic crab, and rich Goan fish curry thali.',
              location: dIdx === 0 ? 'Assagao, Goa' : 'Cavelossim, Goa',
              speciality: 'Goan Fish Curry Thali & Prawn Balchão',
              cost: 380
            };
      }
      if (d.includes('rajasthan') || d.includes('jaipur')) {
        return dietary === 'veg'
          ? {
              title: dIdx === 0 ? 'Laxmi Mishthan Bhandar (LMB) - Royal Dal Baati Churma' : 'Chokhi Dhani Traditional Rajasthani Dining',
              desc: 'Legendary Rajasthani royal heritage feast with crisp baatis drowned in pure ghee, five-lentil dal, and sweet churma.',
              location: 'Johari Bazar, Jaipur',
              speciality: 'Dal Baati Churma & Ghewar',
              cost: 400
            }
          : {
              title: dIdx === 0 ? 'Handi Restaurant - Traditional Rajasthani Laal Maas' : 'Niros Restaurant - Mutton Rogan Josh & Tandoori Grills',
              desc: 'Iconic heritage restaurant renowned for slow-cooked fiery Mathania red chilli Laal Maas and smoked kebabs.',
              location: 'MI Road, Jaipur',
              speciality: 'Smoked Mutton Laal Maas & Rumali Roti',
              cost: 550
            };
      }
      if (d.includes('manali') || d.includes('himachal')) {
        return dietary === 'veg'
          ? {
              title: dIdx === 0 ? 'Chopsticks Old Manali - Steaming Veg Momos & Thukpa' : 'Renaissance Italian & Himachali Woodfire Cafe',
              desc: 'Cozy mountain dining with hot vegetable thukpa noodle broth, steamed momos, and spiced Himachali siddu bread.',
              location: 'Old Manali, Himachal Pradesh',
              speciality: 'Himachali Siddu & Vegetable Thukpa',
              cost: 250
            }
          : {
              title: dIdx === 0 ? 'Johnson\'s Cafe - Woodfire Himalayan Trout Grill' : 'Lazy Dog Lounge - Mountain Riverside Dining',
              desc: 'Freshly caught Beas river trout pan-fried with almond butter sauce and served with roasted mountain herbs.',
              location: 'Circuit House Rd, Old Manali',
              speciality: 'Pan-Seared Himalayan Trout in Lemon Butter',
              cost: 480
            };
      }
      if (d.includes('mumbai')) {
        return dietary === 'veg'
          ? {
              title: 'Swati Snacks - Gujarati & Coastal Street Delights',
              desc: 'Famous heritage spot for baked panki, handvo, crisp sev puri, and authentic sugarcane juice.',
              location: 'Tardeo, Mumbai',
              speciality: 'Baked Panki & Fresh Farsan',
              cost: 300
            }
          : {
              title: 'Britannia & Co. - Legendary Parsi Berry Pulao',
              desc: 'Historic 1923 Parsi institution renowned for fragrant berry pulao with tender mutton and sali boti.',
              location: 'Ballard Estate, Fort, Mumbai',
              speciality: 'Irani Mutton Berry Pulao & Caramel Custard',
              cost: 500
            };
      }
      if (d.includes('delhi')) {
        return dietary === 'veg'
          ? {
              title: 'Paranthe Wali Gali - Century-Old Stuffed Flatbreads',
              desc: 'Historic 1870s alleyway serving piping hot rabri paranthas, khoya paranthas, and spicy mint chutneys.',
              location: 'Chandni Chowk, Old Delhi',
              speciality: 'Crispy Stuffed Paranthas & Sweet Lassi',
              cost: 200
            }
          : {
              title: 'Karim\'s - Historic Mughal Imperial Feast',
              desc: 'World-renowned 1913 eatery near Jama Masjid serving slow-cooked mutton burra, seekh kebabs, and rogan josh.',
              location: 'Gali Kababian, Jama Masjid, Old Delhi',
              speciality: 'Mutton Burra & Imperial Shahi Korma',
              cost: 450
            };
      }
      if (d.includes('paris')) {
        return dietary === 'veg'
          ? {
              title: 'Le Potager du Marais - Artisanal Plant-Based French Bistro',
              desc: 'Classic French vegetarian cuisine with organic ingredients, savory vegetable tarts, and vegan bourguignon.',
              location: 'Rue Rambuteau, Le Marais, Paris',
              speciality: 'French Onion Gratin & Mushroom Bourguignon',
              cost: 35
            }
          : {
              title: 'Bouillon Chartier - Belle Époque Historic Dining',
              desc: 'Legendary 1896 grand hall serving traditional French duck confit, steak frites, and escargot.',
              location: 'Rue du Faubourg Montmartre, Paris',
              speciality: 'Crispy Duck Confit & Roasted Potatoes',
              cost: 40
            };
      }
      if (d.includes('tokyo')) {
        return dietary === 'veg'
          ? {
              title: 'Shojin Ryori Daigo - Traditional Buddhist Plant-Based Tasting',
              desc: 'Michelin-starred seasonal Japanese temple cuisine featuring seasonal wild mountain vegetables, tofu, and miso.',
              location: 'Atago, Minato City, Tokyo',
              speciality: 'Shojin Ryori Zen Kaiseki Multi-Course',
              cost: 60
            }
          : {
              title: 'Toyosu Fish Market - Fresh Morning Nigiri & Yakitori',
              desc: 'World-famous seafood market tasting fresh bluefin tuna nigiri, tamagoyaki, and charcoal-grilled skewers.',
              location: 'Toyosu, Koto City, Tokyo',
              speciality: 'Omakase Tuna Nigiri & Wagyu Skewers',
              cost: 50
            };
      }
      if (d.includes('bangalore') || d.includes('bengaluru')) {
        return dietary === 'veg'
          ? {
              title: dIdx === 0 ? 'Vidyarthi Bhavan - Famous Ghee Masala Dosa' : 'CTR Shri Sagar - Crispy Benne Dosa',
              desc: 'Iconic heritage eatery renowned for golden buttery masala dosas and frothy filter kaapi.',
              location: dIdx === 0 ? 'Gandhi Bazaar, Basavanagudi, Bengaluru' : 'Malleshwaram, Bengaluru',
              speciality: 'Crispy Ghee Butter Dosa & Filter Kaapi',
              cost: 160
            }
          : {
              title: dIdx === 0 ? 'Meghana Foods - Signature Andhra Dum Biryani' : 'Shivaji Military Hotel - Woodfire Mutton Donne Biryani',
              desc: 'Legendary restaurant renowned for spicy Andhra-style chicken dum biryani and chilli chicken.',
              location: dIdx === 0 ? 'Koramangala 5th Block, Bengaluru' : '8th Block, Jayanagar, Bengaluru',
              speciality: 'Spicy Andhra Dum Biryani & Chilli Chicken',
              cost: 320
            };
      }
      if (d.includes('saudi') || d.includes('riyadh')) {
        return {
          title: 'Najd Village - Authentic Heritage Arabian Feast',
          desc: 'Traditional mud-brick courtyard dining serving slow-cooked lamb kabsa, fresh khubz bread, and cardamom saffron tea.',
          location: 'Al Olaya, Riyadh, Saudi Arabia',
          speciality: 'Lamb Hashi Kabsa & Saffron Qahwa',
          cost: 35
        };
      }
      return {
        title: `${params.destination} Authentic Culinary Quarter`,
        desc: `Taste celebrated local specialties and regional dishes at a top-rated neighborhood eatery in ${params.destination}.`,
        location: `Culinary District, ${params.destination}`,
        speciality: `Authentic Regional Delicacies`,
        cost: 25
      };
    };

    // Helper for destination-specific evening / hangout spot
    const getHangoutForDest = (dest: string, dIdx: number) => {
      const d = dest.toLowerCase();
      if (d.includes('goa')) {
        return dIdx === 0
          ? {
              title: 'Thalassa & Vagator Sunset Cliff Promenade',
              desc: 'Breathtaking red cliff promenade overlooking the Arabian Sea, vibrant sunset sessions, and Greek-Goan cafes.',
              location: 'Vagator Cliff, Goa',
              speciality: 'Sunset Views & Coastal Mocktails'
            }
          : {
              title: 'Tito\'s Lane & Baga Beach Twilight Shacks',
              desc: 'Lively beachfront walkway with glowing neon lights, acoustic music, and sizzling seafood barbecue.',
              location: 'Baga Beach, Goa',
              speciality: 'Beachside Night Atmosphere & Seafood BBQ'
            };
      }
      if (d.includes('rajasthan') || d.includes('jaipur')) {
        return {
          title: 'Nahargarh Fort Sunset Point Overlooking Jaipur',
          desc: 'Perched on the edge of the Aravalli hills, watch the sunset bathe the entire Pink City in golden light from the historic ramparts.',
          location: 'Nahargarh Fort, Jaipur',
          speciality: 'Panoramic Sunset Vista Over the City'
        };
      }
      if (d.includes('manali') || d.includes('himachal')) {
        return {
          title: 'Mall Road Promenade & Himalayan Cedar Walk',
          desc: 'Pedestrian street lined with pine craft shops, street food stalls, and misty evening mountain air.',
          location: 'The Mall, Manali',
          speciality: 'Warm Kashmiri Kahwa & Artisan Shawls'
        };
      }
      if (d.includes('paris')) {
        return {
          title: 'Seine Riverbanks & Pont des Arts Twilight Stroll',
          desc: 'Romantic evening walk along the illuminated Seine, gazing at the Eiffel Tower light sparkles and street musicians.',
          location: 'Quai de la Seine, Paris',
          speciality: 'Illuminated Riverbanks & Parisian Cafes'
        };
      }
      if (d.includes('tokyo')) {
        return {
          title: 'Shibuya Sky & Omoide Yokocho Lantern Alley',
          desc: 'Panoramic open-air observation deck followed by dinner in the nostalgic lantern-lit yakitori alleys of Shinjuku.',
          location: 'Shibuya & Shinjuku, Tokyo',
          speciality: '360° Neon Skyline & Yakitori Atmosphere'
        };
      }
      if (d.includes('bangalore') || d.includes('bengaluru')) {
        return {
          title: 'Church Street & Blossoms Book House Cultural Hangout',
          desc: 'Bangalore favorite walking street: browse vintage books across 3 floors at Blossoms, enjoy specialty roasts, and soak in indie culture.',
          location: 'Church Street, Bengaluru',
          speciality: 'Vintage Books & Indie Coffee Culture'
        };
      }
      return {
        title: `${params.destination} Central Promenade & Vibrant Cafes`,
        desc: `Relax along the city's most beloved gathering plaza, featuring boutique cafes and lively local street culture.`,
        location: `Central Boulevard, ${params.destination}`,
        speciality: 'Local Gathering Spot & Artisan Coffee'
      };
    };

    for (let dayIdx = 0; dayIdx < params.durationDays; dayIdx++) {
      const currentDayDate = new Date(startDateObj);
      currentDayDate.setDate(startDateObj.getDate() + dayIdx);
      const dateStr = currentDayDate.toISOString().split('T')[0];
      const themePreset = themes[dayIdx % themes.length];
      const weather = forecast[dayIdx] || forecast[0];

      // Select distinct places across days
      const morningPlace = places.length > 0
        ? places[(dayIdx * 2) % places.length]
        : {
            name: `${params.destination} Historic Landmark`,
            description: `Explore historic architecture and landmarks in ${params.destination}.`,
            address: `Central District, ${params.destination}`,
            lat: coords.lat + 0.005,
            lng: coords.lng + 0.005,
            estimatedCost: 20
          };

      const afternoonPlace = places.length > 1
        ? places[(dayIdx * 2 + 1) % places.length]
        : {
            name: `${params.destination} Cultural Exhibition & Gardens`,
            description: `Stroll through peaceful botanical grounds and exhibitions in ${params.destination}.`,
            address: `Promenade, ${params.destination}`,
            lat: coords.lat - 0.004,
            lng: coords.lng + 0.006,
            estimatedCost: 25
          };

      const diningInfo = getDiningForDest(params.destination, dietaryChoice, dayIdx);
      const hangoutInfo = getHangoutForDest(params.destination, dayIdx);

      const activities: PlannedActivity[] = [
        // 1. Morning Landmark / Heritage Sight
        {
          title: morningPlace.name,
          description: morningPlace.description || `Morning exploration of top cultural landmarks in ${params.destination}.`,
          category: 'cultural',
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 120,
          locationName: morningPlace.name,
          locationAddress: morningPlace.address || `Central District, ${params.destination}`,
          latitude: morningPlace.lat || coords.lat,
          longitude: morningPlace.lng || coords.lng,
          estimatedCost: Math.round((morningPlace.estimatedCost || 30) * currencyRate),
          currency: params.currency,
          speciality: 'Iconic Architecture & Heritage Grounds',
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 1,
          travelFromPrevious: undefined
        },
        // 2. Midday Culinary Spot with Veg / Non-Veg Speciality
        {
          title: diningInfo.title,
          description: diningInfo.desc,
          category: 'dining',
          startTime: '11:30',
          endTime: '13:00',
          durationMinutes: 90,
          locationName: diningInfo.title.split('-')[0].trim(),
          locationAddress: diningInfo.location,
          latitude: coords.lat + 0.002,
          longitude: coords.lng + 0.003,
          estimatedCost: Math.round(diningInfo.cost * (params.currency === 'INR' ? 1 : currencyRate)),
          currency: params.currency,
          dietaryTag: (dietaryChoice === 'veg' ? 'veg' : dietaryChoice === 'non_veg' ? 'non-veg' : 'both') as any,
          speciality: diningInfo.speciality,
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
          title: afternoonPlace.name,
          description: afternoonPlace.description || `Afternoon discovery of scenic viewpoints and artistic exhibits in ${params.destination}.`,
          category: 'sightseeing',
          startTime: '13:30',
          endTime: '15:30',
          durationMinutes: 120,
          locationName: afternoonPlace.name,
          locationAddress: afternoonPlace.address || `Parkway, ${params.destination}`,
          latitude: afternoonPlace.lat || coords.lat - 0.003,
          longitude: afternoonPlace.lng || coords.lng + 0.004,
          estimatedCost: Math.round((afternoonPlace.estimatedCost || 25) * currencyRate),
          currency: params.currency,
          speciality: 'Scenic Panoramas & Exhibitions',
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
          title: hangoutInfo.title,
          description: hangoutInfo.desc,
          category: 'relaxation',
          startTime: '16:00',
          endTime: '17:30',
          durationMinutes: 90,
          locationName: hangoutInfo.title.split('&')[0].trim(),
          locationAddress: hangoutInfo.location,
          latitude: coords.lat + 0.003,
          longitude: coords.lng - 0.002,
          estimatedCost: Math.round(25 * currencyRate),
          currency: params.currency,
          speciality: hangoutInfo.speciality,
          bookingRequired: false,
          bookingStatus: 'not_booked',
          orderIndex: 4,
          travelFromPrevious: {
            mode: 'walking',
            durationMinutes: 15,
            distanceKm: 1.2
          }
        },
        // 5. Evening Dining & Night Social Atmosphere
        {
          title: `${params.destination} Evening Food Feast & Twilight Walk`,
          description: `Wind down your day with authentic local delicacies, evening music, and vibrant night atmosphere in ${params.destination}.`,
          category: 'dining',
          startTime: '18:00',
          endTime: '20:00',
          durationMinutes: 120,
          locationName: `${params.destination} Waterfront Promenade`,
          locationAddress: `Promenade District, ${params.destination}`,
          latitude: coords.lat - 0.002,
          longitude: coords.lng + 0.002,
          estimatedCost: Math.round(35 * currencyRate),
          currency: params.currency,
          dietaryTag: (dietaryChoice === 'veg' ? 'veg' : 'both') as any,
          speciality: 'Evening Street Specialties & Twilight Views',
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
