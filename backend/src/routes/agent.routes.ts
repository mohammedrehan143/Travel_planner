import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { planTripSchema, modifyTripSchema, regenerateDaySchema } from '../schemas/trip.schema.js';
import { planningRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// POST /api/trips/plan
router.post('/trips/plan', planningRateLimiter, requireAuth, validateBody(planTripSchema), AgentController.planTrip);

// GET /api/agent-runs/:id
router.get('/agent-runs/:id', requireAuth, AgentController.getRunStatus);

// POST /api/trips/:id/modify
router.post('/trips/:id/modify', requireAuth, validateBody(modifyTripSchema), AgentController.modifyTrip);

// POST /api/trips/:id/days/:dayNumber/regenerate & /api/trips/:id/regenerate-day
router.post('/trips/:id/days/:dayNumber/regenerate', requireAuth, validateBody(regenerateDaySchema), AgentController.regenerateDay);
router.post('/trips/:id/regenerate-day', requireAuth, AgentController.regenerateDay);

// POST /api/trips/:id/validate
router.post('/trips/:id/validate', requireAuth, AgentController.validateTrip);

export default router;
