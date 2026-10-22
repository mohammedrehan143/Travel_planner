import { Router } from 'express';
import { TripController } from '../controllers/trip.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { updateTripSchema, addCollaboratorSchema } from '../schemas/trip.schema.js';

const router = Router();

// GET /api/trips
router.get('/', requireAuth, TripController.listTrips);

// GET /api/trips/:id
router.get('/:id', requireAuth, TripController.getTrip);

// PATCH /api/trips/:id
router.patch('/:id', requireAuth, validateBody(updateTripSchema), TripController.updateTrip);

// DELETE /api/trips/:id
router.delete('/:id', requireAuth, TripController.deleteTrip);

// POST /api/trips/:id/collaborators
router.post('/:id/collaborators', requireAuth, validateBody(addCollaboratorSchema), TripController.addCollaborator);

export default router;
