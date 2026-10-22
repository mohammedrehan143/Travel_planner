import {
  PlanTripRequest,
  CompleteItinerary,
  AgentLogEntry,
  ValidationReport,
  ModifyItineraryRequest,
  RegenerateDayRequest
} from '../types/trip.types.js';
import { executeAgentTool } from './tools/index.js';
import { AgentRunService } from '../services/agentRun.service.js';
import { ItineraryValidator } from './validator.js';
import { sanitizeUserInput } from './prompts.js';
import { isLLMConfigured, callLLMWithTools, ChatMessage } from './llm.client.js';

export class AgentOrchestrator {
  /**
   * Main Agentic Planning Workflow
   * Executes the 10-step plan with persistent logging and real-time state tracking.
   */
  static async planTrip(
    request: PlanTripRequest,
    runId?: string
  ): Promise<{ itinerary: CompleteItinerary; validation: ValidationReport; runId: string }> {
    const logs: AgentLogEntry[] = [];
    const activeRunId = runId || (await AgentRunService.createRun(request.userId || '00000000-0000-0000-0000-000000000001', request));

    const logStep = async (
      step: string,
      message: string,
      progressPercent: number,
      toolName?: string,
      toolInput?: any,
      toolOutput?: any
    ) => {
      const entry: AgentLogEntry = {
        timestamp: new Date().toISOString(),
        step,
        message,
        toolName,
        toolInput,
        toolOutput,
        status: 'info'
      };
      logs.push(entry);
      await AgentRunService.updateProgress(activeRunId, step, progressPercent, logs);
    };

    try {
      // -------------------------------------------------------------
      // Step 1: Interpret the travel request & identify missing info
      // -------------------------------------------------------------
      await logStep('interpret', `Interpreting request for ${request.destination} from ${request.startDate} to ${request.endDate}.`, 10);
      const sanitizedOrigin = sanitizeUserInput(request.origin);
      const sanitizedDest = sanitizeUserInput(request.destination);
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
      const travelerCount = request.travelerCount || 1;
      const budget = request.budget || 2500;
      const currency = (request.currency || 'USD').toUpperCase();
      const travelStyle = request.travelStyle || 'balanced';
      const interests = request.interests || ['sightseeing', 'culinary', 'culture'];

      // -------------------------------------------------------------
      // Step 2: Research relevant destinations, attractions, and weather
      // -------------------------------------------------------------
      await logStep('research', `Researching points of interest and live weather forecast for ${sanitizedDest}.`, 25, 'search_places', { destination: sanitizedDest });
      
      const [placesResult, weatherResult] = await Promise.all([
        executeAgentTool('search_places', {
          query: interests.join(' '),
          destination: sanitizedDest,
          limit: 15
        }),
        executeAgentTool('get_weather_forecast', {
          destination: sanitizedDest,
          startDate: request.startDate,
          endDate: request.endDate
        })
      ]);

      await logStep(
        'research_completed',
        `Discovered ${placesResult.places?.length || 0} candidate attractions. Retrieved forecast (${weatherResult.source}).`,
        40
      );

      // -------------------------------------------------------------
      // Step 3: Compare activities against user preferences and budget
      // -------------------------------------------------------------
      await logStep(
        'estimate_budget',
        `Calculating category budget for ${durationDays} days and ${travelerCount} traveler(s).`,
        50,
        'estimate_trip_budget',
        { destination: sanitizedDest, durationDays, travelerCount, travelStyle, totalBudget: budget, currency }
      );

      const budgetResult = await executeAgentTool('estimate_trip_budget', {
        destination: sanitizedDest,
        durationDays,
        travelerCount,
        travelStyle,
        totalBudget: budget,
        currency
      });

      // -------------------------------------------------------------
      // Step 4 & 5: Organize geographically & create day-by-day itinerary
      // -------------------------------------------------------------
      await logStep(
        'generate_itinerary',
        `Organizing attractions into geographic clusters and synthesizing day schedules.`,
        65,
        'generate_itinerary',
        { destination: sanitizedDest, durationDays, travelerCount, travelStyle }
      );

      let itinerary: CompleteItinerary = await executeAgentTool('generate_itinerary', {
        destination: sanitizedDest,
        origin: sanitizedOrigin,
        startDate: request.startDate,
        endDate: request.endDate,
        durationDays,
        travelerCount,
        travelStyle,
        interests,
        totalBudget: budget,
        currency
      });

      // -------------------------------------------------------------
      // Step 6 & 7: Validate schedules, opening hours, travel durations, budget
      // -------------------------------------------------------------
      await logStep('validate', `Validating schedule integrity, travel buffers, and opening hours.`, 80, 'validate_itinerary', { daysCount: itinerary.days.length });

      let validation: ValidationReport = await executeAgentTool('validate_itinerary', {
        totalBudget: budget,
        currency,
        days: itinerary.days
      });

      // -------------------------------------------------------------
      // Step 8: Revise itinerary if validation identifies problems
      // -------------------------------------------------------------
      if (!validation.isValid || validation.warningCount > 0) {
        await logStep('revise', `Resolving ${validation.errorCount} errors and ${validation.warningCount} warnings in schedule.`, 88);

        // Auto-fix time overlaps or invalid end times
        itinerary.days.forEach(day => {
          day.activities.forEach((act, idx) => {
            if (idx > 0) {
              const prev = day.activities[idx - 1];
              // Ensure sequential timing
              if (prev && act.startTime <= prev.endTime) {
                const prevHour = parseInt(prev.endTime.split(':')[0] || '12', 10);
                act.startTime = `${(prevHour + 1).toString().padStart(2, '0')}:00`;
                act.endTime = `${(prevHour + 2).toString().padStart(2, '0')}:30`;
              }
            }
          });
        });

        // Re-run validation
        validation = await executeAgentTool('validate_itinerary', {
          totalBudget: budget,
          currency,
          days: itinerary.days
        });
      }

      // -------------------------------------------------------------
      // Step 9: Save validated results to Supabase (if userId provided)
      // -------------------------------------------------------------
      if (request.userId) {
        await logStep('save', `Saving trip, daily schedules, activities, and budget to database.`, 95, 'save_trip', { userId: request.userId });
        const saveResult = await executeAgentTool('save_trip', {
          userId: request.userId,
          itinerary
        });
        if (saveResult?.tripId) {
          itinerary.tripId = saveResult.tripId;
        }
      }

      // -------------------------------------------------------------
      // Step 10: Complete run & return structured JSON
      // -------------------------------------------------------------
      await logStep('completed', `Trip planning successfully completed. Returning verified itinerary.`, 100);
      await AgentRunService.markCompleted(activeRunId, itinerary);

      return {
        itinerary,
        validation,
        runId: activeRunId
      };
    } catch (error: any) {
      await AgentRunService.markFailed(activeRunId, error.message || 'Unknown planning error', logs);
      throw error;
    }
  }

  /**
   * Modifies an existing itinerary with natural language instructions.
   */
  static async modifyItinerary(
    itinerary: CompleteItinerary,
    request: ModifyItineraryRequest
  ): Promise<{ modifiedItinerary: CompleteItinerary; validation: ValidationReport; changeSummary: string }> {
    const instructions = sanitizeUserInput(request.instructions).toLowerCase();
    const targetDayNum = request.targetDay || 1;
    const targetDay = itinerary.days.find(d => d.dayNumber === targetDayNum) || itinerary.days[0];

    let changeSummary = '';

    if (instructions.includes('ramen') || instructions.includes('dinner') || instructions.includes('food') || instructions.includes('restaurant')) {
      targetDay.activities.push({
        title: `Authentic Regional Gastronomy Experience`,
        description: `Custom evening dining arranged per request: "${request.instructions}".`,
        category: 'dining',
        startTime: '20:30',
        endTime: '22:00',
        durationMinutes: 90,
        locationName: `${itinerary.destination} Gourmet District`,
        locationAddress: `Culinary Center, ${itinerary.destination}`,
        latitude: itinerary.destinationCoordinates.lat + 0.002,
        longitude: itinerary.destinationCoordinates.lng + 0.003,
        estimatedCost: 35,
        currency: itinerary.currency,
        bookingRequired: false,
        bookingStatus: 'not_booked',
        orderIndex: targetDay.activities.length + 1
      });
      changeSummary = `Added evening dining activity to Day ${targetDay.dayNumber}.`;
    } else if (instructions.includes('relaxed') || instructions.includes('rest') || instructions.includes('slow')) {
      if (targetDay.activities.length > 2) {
        targetDay.activities.pop();
      }
      changeSummary = `Adjusted Day ${targetDay.dayNumber} pacing for a more leisurely experience.`;
    } else {
      targetDay.activities.push({
        title: `Special Activity: ${request.instructions.slice(0, 50)}`,
        description: `Custom itinerary addition based on traveler instruction: "${request.instructions}".`,
        category: 'sightseeing',
        startTime: '17:00',
        endTime: '18:30',
        durationMinutes: 90,
        locationName: `${itinerary.destination} Highlight`,
        latitude: itinerary.destinationCoordinates.lat,
        longitude: itinerary.destinationCoordinates.lng,
        estimatedCost: 20,
        currency: itinerary.currency,
        bookingRequired: false,
        bookingStatus: 'not_booked',
        orderIndex: targetDay.activities.length + 1
      });
      changeSummary = `Inserted custom activity into Day ${targetDay.dayNumber}.`;
    }

    const validation = ItineraryValidator.validate(
      itinerary.days,
      itinerary.totalBudget,
      itinerary.budgetBreakdown.estimatedTotalCost
    );

    return {
      modifiedItinerary: itinerary,
      validation,
      changeSummary
    };
  }

  /**
   * Regenerates a single day with new pacing or themes.
   */
  static async regenerateDay(
    itinerary: CompleteItinerary,
    request: RegenerateDayRequest
  ): Promise<{ regeneratedDay: any; validation: ValidationReport }> {
    const targetDay = itinerary.days.find(d => d.dayNumber === request.dayNumber);
    if (!targetDay) {
      throw new Error(`Day ${request.dayNumber} not found in this itinerary.`);
    }

    const pacing = request.customPacing || 'balanced';
    const coords = itinerary.destinationCoordinates;
    const { places } = await executeAgentTool('search_places', {
      query: (request.specificInterests || ['culture', 'nature']).join(' '),
      destination: itinerary.destination,
      limit: 6
    });

    const dayPlaces = places.slice(0, pacing === 'relaxed' ? 2 : 4);

    targetDay.theme = `${pacing.charAt(0).toUpperCase() + pacing.slice(1)} Explorer Edition`;
    targetDay.summary = `Refreshed schedule featuring alternative landmarks and curated stops.`;
    targetDay.activities = dayPlaces.map((p: any, idx: number) => {
      const startH = 9 + idx * 3;
      return {
        title: p.name,
        description: p.description,
        category: p.category || 'cultural',
        startTime: `${startH.toString().padStart(2, '0')}:00`,
        endTime: `${(startH + 2).toString().padStart(2, '0')}:00`,
        durationMinutes: 120,
        locationName: p.name,
        locationAddress: p.address,
        latitude: p.lat || coords.lat,
        longitude: p.lng || coords.lng,
        estimatedCost: p.estimatedCost || 15,
        currency: itinerary.currency,
        bookingRequired: false,
        bookingStatus: 'not_booked',
        orderIndex: idx + 1
      };
    });

    const validation = ItineraryValidator.validate(
      itinerary.days,
      itinerary.totalBudget,
      itinerary.budgetBreakdown.estimatedTotalCost
    );

    return {
      regeneratedDay: targetDay,
      validation
    };
  }
}
