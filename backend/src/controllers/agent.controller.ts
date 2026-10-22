import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AgentOrchestrator } from '../agent/orchestrator.js';
import { AgentRunService } from '../services/agentRun.service.js';
import { TripService } from '../services/trip.service.js';
import { PlanTripRequest } from '../types/trip.types.js';
import { generateChatReply } from '../agent/llm.client.js';

export class AgentController {
  /** POST /api/agent/chat — conversational endpoint usable with local or saved trips. */
  static async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { message, context } = req.body as { message: string; context?: Record<string, unknown> };
      const reply = await generateChatReply(message, context || {});
      if (!reply) {
        res.status(200).json({
          status: 'success',
          message: 'I am here to help you navigate your trip! You can ask me for recommendations on dining, sightseeing, local specialities, or adjusting your schedule.'
        });
        return;
      }
      res.status(200).json({ status: 'success', message: reply });
    } catch (err: any) {
      console.warn('AgentController.chat caught upstream error:', err?.message || err);
      const isRateLimit = err?.message?.includes('429') || err?.status === 429;
      const friendlyMessage = isRateLimit
        ? 'The AI assistant is experiencing high request volume on the free tier. Please wait a moment and try again, or ask about local dining, sights, and hangout spots!'
        : (err.message || 'The AI assistant is temporarily unavailable.');
      res.status(200).json({ status: 'success', message: friendlyMessage });
    }
  }

  /**
   * POST /api/trips/plan
   * Start a trip planning run (supports async background tracking or synchronous return)
   */
  static async planTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const body = req.body as PlanTripRequest & { asyncExecution?: boolean };
      body.userId = userId;

      // Create persistent run record
      const runId = await AgentRunService.createRun(userId, body);

      if (body.asyncExecution) {
        // Run in background without blocking HTTP response
        AgentOrchestrator.planTrip(body, runId).catch(err => {
          console.error(`[AgentRun ${runId}] Async execution error:`, err);
        });

        res.status(202).json({
          status: 'accepted',
          message: 'Trip planning run initiated. Poll /api/agent-runs/:id for status.',
          runId,
          checkStatusUrl: `/api/agent-runs/${runId}`
        });
        return;
      }

      // Synchronous execution
      const result = await AgentOrchestrator.planTrip(body, runId);
      res.status(200).json({
        status: 'completed',
        runId,
        itinerary: result.itinerary,
        validation: result.validation
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Planning Failed',
        message: err.message || 'Failed to complete trip planning run.'
      });
    }
  }

  /**
   * GET /api/agent-runs/:id
   * Retrieve real-time planning status, current step, logs, and final result
   */
  static async getRunStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const runId = String(req.params.id);
      const run = await AgentRunService.getRun(runId);

      if (!run) {
        res.status(404).json({
          error: 'Not Found',
          message: `Agent run with id ${runId} was not found.`
        });
        return;
      }

      res.status(200).json({
        runId: run.id,
        status: run.status,
        currentStep: run.current_step,
        progressPercent: run.progress_percent,
        logs: run.logs,
        result: run.result,
        errorMessage: run.error_message,
        startedAt: run.started_at,
        completedAt: run.completed_at
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Query Failed',
        message: err.message || 'Failed to fetch agent run status.'
      });
    }
  }

  /**
   * POST /api/trips/:id/modify
   * Modify an existing trip itinerary with natural language instructions
   */
  static async modifyTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = String(req.params.id);
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const { instructions, targetDay } = req.body;

      const trip = await TripService.getTripById(tripId, userId);
      if (!trip) {
        res.status(404).json({ error: 'Trip Not Found', message: `Trip ${tripId} not found.` });
        return;
      }

      // Format as CompleteItinerary for agent modification
      const mockItinerary: any = {
        tripId: trip.id,
        title: trip.title,
        description: trip.description,
        destination: trip.destination,
        origin: trip.origin,
        startDate: trip.start_date,
        endDate: trip.end_date,
        durationDays: trip.duration_days,
        travelerCount: trip.traveler_count,
        travelStyle: trip.travel_style,
        interests: trip.interests,
        totalBudget: trip.total_budget,
        currency: trip.currency,
        destinationCoordinates: {
          lat: trip.destination_lat || 35.6762,
          lng: trip.destination_lng || 139.6503
        },
        days: trip.days.map((d: any) => ({
          dayNumber: d.day_number,
          date: d.date,
          theme: d.theme,
          summary: d.summary,
          activities: d.activities.map((a: any) => ({
            title: a.title,
            description: a.description,
            category: a.category,
            startTime: a.start_time,
            endTime: a.end_time,
            durationMinutes: a.duration_minutes,
            locationName: a.location_name,
            locationAddress: a.location_address,
            latitude: a.latitude,
            longitude: a.longitude,
            estimatedCost: a.estimated_cost,
            currency: a.currency,
            bookingRequired: a.booking_required,
            bookingStatus: a.booking_status,
            orderIndex: a.order_index
          }))
        })),
        budgetBreakdown: {
          currency: trip.currency,
          totalBudget: trip.total_budget,
          estimatedTotalCost: trip.total_budget * 0.9,
          surplusOrDeficit: trip.total_budget * 0.1,
          isWithinBudget: true,
          categories: {},
          costPerTraveler: trip.total_budget / trip.traveler_count,
          recommendations: []
        }
      };

      const result = await AgentOrchestrator.modifyItinerary(mockItinerary, {
        tripId,
        instructions,
        targetDay
      });

      res.status(200).json({
        status: 'success',
        changeSummary: result.changeSummary,
        itinerary: result.modifiedItinerary,
        validation: result.validation
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Modification Failed',
        message: err.message || 'Failed to apply trip modifications.'
      });
    }
  }

  /**
   * POST /api/trips/:id/days/:dayNumber/regenerate
   * Regenerate a single day
   */
  static async regenerateDay(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = String(req.params.id);
      const dayNumber = req.body.dayNumber
        ? parseInt(String(req.body.dayNumber), 10)
        : parseInt(String(req.params.dayNumber || '1'), 10);
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const customPacing = req.body.customPacing;
      const specificInterests = req.body.specificInterests || (req.body.focus ? [req.body.focus] : undefined);

      const trip = await TripService.getTripById(tripId, userId);
      if (!trip) {
        res.status(404).json({ error: 'Trip Not Found', message: `Trip ${tripId} not found.` });
        return;
      }

      const mockItinerary: any = {
        tripId: trip.id,
        destination: trip.destination,
        currency: trip.currency,
        totalBudget: trip.total_budget,
        destinationCoordinates: {
          lat: trip.destination_lat || 35.6762,
          lng: trip.destination_lng || 139.6503
        },
        days: trip.days.map((d: any) => ({
          dayNumber: d.day_number,
          date: d.date,
          theme: d.theme,
          summary: d.summary,
          activities: d.activities || []
        })),
        budgetBreakdown: { estimatedTotalCost: 1000 }
      };

      const result = await AgentOrchestrator.regenerateDay(mockItinerary, {
        tripId,
        dayNumber,
        customPacing,
        specificInterests
      });

      res.status(200).json({
        status: 'success',
        dayNumber,
        day: result.regeneratedDay,
        regeneratedDay: result.regeneratedDay,
        validation: result.validation
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Regeneration Failed',
        message: err.message || 'Failed to regenerate day.'
      });
    }
  }

  /**
   * POST /api/trips/:id/validate
   * Run validation on an itinerary
   */
  static async validateTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = String(req.params.id);
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

      const trip = await TripService.getTripById(tripId, userId);
      if (!trip) {
        res.status(404).json({ error: 'Trip Not Found', message: `Trip ${tripId} not found.` });
        return;
      }

      const days = trip.days.map((d: any) => ({
        dayNumber: d.day_number,
        date: d.date,
        theme: d.theme,
        summary: d.summary,
        activities: (d.activities || []).map((a: any) => ({
          ...a,
          startTime: a.start_time || a.startTime,
          endTime: a.end_time || a.endTime,
          estimatedCost: a.estimated_cost || a.estimatedCost || 0
        }))
      }));

      const totalActivitiesCost = days.reduce(
        (sum: number, d: any) => sum + d.activities.reduce((s: number, a: any) => s + (a.estimatedCost || 0), 0),
        0
      );

      const validation = (await import('../agent/validator.js')).ItineraryValidator.validate(
        days as any,
        trip.total_budget,
        totalActivitiesCost
      );

      res.status(200).json({
        tripId,
        validation
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Validation Failed',
        message: err.message || 'Failed to validate trip.'
      });
    }
  }
}
