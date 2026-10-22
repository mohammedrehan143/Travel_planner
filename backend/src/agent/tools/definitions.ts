/**
 * Tool Definitions Schema for OpenAI / Agent Tool Calling
 */

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_places',
      description: 'Search for attractions, landmarks, restaurants, and points of interest in a destination.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords, e.g. "historic temples", "ramen restaurants", "art museum"' },
          destination: { type: 'string', description: 'City and country, e.g. "Tokyo, Japan"' },
          category: {
            type: 'string',
            enum: ['sightseeing', 'dining', 'cultural', 'outdoor', 'transit', 'shopping', 'entertainment', 'relaxation'],
            description: 'Optional category filter'
          },
          limit: { type: 'number', description: 'Maximum number of places to return (1-20)', default: 10 }
        },
        required: ['query', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_place_details',
      description: 'Retrieve detailed information for a specific place including address, ratings, opening hours, and cost.',
      parameters: {
        type: 'object',
        properties: {
          placeName: { type: 'string', description: 'Exact or approximate name of the attraction or restaurant' },
          destination: { type: 'string', description: 'City and country' }
        },
        required: ['placeName', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_weather_forecast',
      description: 'Retrieve daily weather forecast (temperature, precipitation probability, condition) for destination dates.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'City and country' },
          startDate: { type: 'string', description: 'Trip start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Trip end date (YYYY-MM-DD)' },
          lat: { type: 'number', description: 'Optional latitude' },
          lng: { type: 'number', description: 'Optional longitude' }
        },
        required: ['destination', 'startDate', 'endDate']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_route',
      description: 'Calculate transit or walking distance, duration, and route feasibility between two locations.',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'string', description: 'Starting place name or address' },
          destination: { type: 'string', description: 'Destination place name or address' },
          transportMode: {
            type: 'string',
            enum: ['walking', 'driving', 'transit', 'cycling'],
            description: 'Mode of transit',
            default: 'transit'
          },
          originCoords: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' }
            }
          },
          destinationCoords: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' }
            }
          }
        },
        required: ['origin', 'destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_opening_hours',
      description: 'Check whether an attraction or restaurant is open on a specific day of week and time.',
      parameters: {
        type: 'object',
        properties: {
          placeName: { type: 'string', description: 'Name of place' },
          destination: { type: 'string', description: 'City' },
          dayOfWeek: {
            type: 'string',
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            description: 'Day of week'
          },
          checkTime: { type: 'string', description: 'Time in 24-hr format (HH:MM)' }
        },
        required: ['placeName', 'destination', 'dayOfWeek', 'checkTime']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'estimate_trip_budget',
      description: 'Compute realistic budget distribution for accommodation, meals, activities, transit, and buffer.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string', description: 'Destination city' },
          durationDays: { type: 'number', description: 'Total trip duration in days' },
          travelerCount: { type: 'number', description: 'Number of travelers' },
          travelStyle: {
            type: 'string',
            enum: ['budget', 'backpacking', 'balanced', 'cultural', 'luxury', 'adventure', 'relaxed']
          },
          totalBudget: { type: 'number', description: 'Total available budget' },
          currency: { type: 'string', description: 'Currency code, e.g. USD, EUR, JPY', default: 'USD' }
        },
        required: ['destination', 'durationDays', 'travelerCount', 'travelStyle', 'totalBudget']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_itinerary',
      description: 'Synthesize a coherent day-by-day itinerary with geographic clustering and realistic timing.',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
          origin: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          durationDays: { type: 'number' },
          travelerCount: { type: 'number' },
          travelStyle: { type: 'string' },
          travelCompanion: { type: 'string' },
          dietaryPreference: { type: 'string' },
          interests: { type: 'array', items: { type: 'string' } },
          totalBudget: { type: 'number' },
          currency: { type: 'string' }
        },
        required: ['destination', 'origin', 'startDate', 'endDate', 'durationDays', 'travelerCount', 'travelStyle', 'totalBudget', 'currency']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'validate_itinerary',
      description: 'Validate an itinerary against operational constraints (opening hours, overlaps, pacing, budget).',
      parameters: {
        type: 'object',
        properties: {
          totalBudget: { type: 'number' },
          currency: { type: 'string' },
          days: { type: 'array', items: { type: 'object' } }
        },
        required: ['totalBudget', 'days']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_trip',
      description: 'Update metadata or preferences for an existing trip in the database.',
      parameters: {
        type: 'object',
        properties: {
          tripId: { type: 'string', description: 'Trip UUID' },
          updates: { type: 'object', description: 'Key-value map of trip fields to update' }
        },
        required: ['tripId', 'updates']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_trip',
      description: 'Persist the complete planned itinerary, days, activities, and budget into Supabase database.',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'Owner user UUID' },
          itinerary: { type: 'object', description: 'Complete itinerary object' }
        },
        required: ['userId', 'itinerary']
      }
    }
  }
];
