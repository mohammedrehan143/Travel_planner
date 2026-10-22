import { AGENT_TOOLS } from './definitions.js';
import { ToolHandlers } from './handlers.js';

export { AGENT_TOOLS, ToolHandlers };

export type ToolName =
  | 'search_places'
  | 'get_place_details'
  | 'get_weather_forecast'
  | 'calculate_route'
  | 'check_opening_hours'
  | 'estimate_trip_budget'
  | 'generate_itinerary'
  | 'validate_itinerary'
  | 'update_trip'
  | 'save_trip';

/**
 * Executes a tool by name with arguments and handles any execution errors.
 */
export async function executeAgentTool(name: string, args: Record<string, any>): Promise<any> {
  try {
    switch (name as ToolName) {
      case 'search_places':
        return await ToolHandlers.searchPlaces(args as any);

      case 'get_place_details':
        return await ToolHandlers.getPlaceDetails(args as any);

      case 'get_weather_forecast':
        return await ToolHandlers.getWeatherForecast(args as any);

      case 'calculate_route':
        return await ToolHandlers.calculateRoute(args as any);

      case 'check_opening_hours':
        return await ToolHandlers.checkOpeningHours(args as any);

      case 'estimate_trip_budget':
        return await ToolHandlers.estimateTripBudget(args as any);

      case 'generate_itinerary':
        return await ToolHandlers.generateItinerary(args as any);

      case 'validate_itinerary':
        return ToolHandlers.validateItinerary(args as any);

      case 'update_trip':
        return await ToolHandlers.updateTrip(args as any);

      case 'save_trip':
        return await ToolHandlers.saveTrip(args as any);

      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  } catch (error: any) {
    return {
      error: `Failed to execute tool ${name}: ${error.message || String(error)}`
    };
  }
}
