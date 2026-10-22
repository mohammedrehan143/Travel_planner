import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TripService } from '../services/trip.service.js';

export class TripController {
  /**
   * GET /api/trips
   */
  static async listTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const trips = await TripService.listTrips(userId);
      res.status(200).json({ trips });
    } catch (err: any) {
      res.status(500).json({ error: 'Query Failed', message: err.message });
    }
  }

  /**
   * GET /api/trips/:id
   */
  static async getTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const tripId = String(req.params.id);
      const trip = await TripService.getTripById(tripId, userId);

      if (!trip) {
        res.status(404).json({ error: 'Not Found', message: `Trip ${tripId} not found.` });
        return;
      }

      res.status(200).json({ trip });
    } catch (err: any) {
      res.status(500).json({ error: 'Query Failed', message: err.message });
    }
  }

  /**
   * PATCH /api/trips/:id
   */
  static async updateTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const tripId = String(req.params.id);
      const updated = await TripService.updateTrip(tripId, req.body, userId);
      res.status(200).json({ status: 'updated', trip: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Update Failed', message: err.message });
    }
  }

  /**
   * DELETE /api/trips/:id
   */
  static async deleteTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
      const tripId = String(req.params.id);
      await TripService.deleteTrip(tripId, userId);
      res.status(200).json({ status: 'deleted', tripId });
    } catch (err: any) {
      res.status(500).json({ error: 'Delete Failed', message: err.message });
    }
  }

  /**
   * POST /api/trips/:id/collaborators
   */
  static async addCollaborator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tripId = String(req.params.id);
      const { email, role } = req.body;
      const collaborator = await TripService.addCollaborator(tripId, email, role);
      res.status(201).json({ status: 'added', collaborator });
    } catch (err: any) {
      res.status(500).json({ error: 'Collaborator Failed', message: err.message });
    }
  }
}
