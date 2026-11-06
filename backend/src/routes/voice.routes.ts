import { Router } from 'express';
import { VoiceController } from '../controllers/voice.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { z } from 'zod';

const router = Router();

// POST /api/voice/stt - Transcribe speech audio to text
router.post(
  '/stt',
  chatRateLimiter,
  requireAuth,
  validateBody(
    z.object({
      audio: z.string().min(1, 'Audio data is required'),
      format: z.string().optional(),
      language: z.string().optional()
    })
  ),
  VoiceController.transcribe
);

// POST /api/voice/tts - Synthesize text to speech
router.post(
  '/tts',
  chatRateLimiter,
  requireAuth,
  validateBody(
    z.object({
      text: z.string().min(1, 'Text to synthesize is required').max(4000),
      voice: z.string().optional(),
      language: z.string().optional(),
      speed: z.number().min(0.25).max(4.0).optional(),
      stream: z.boolean().optional()
    })
  ),
  VoiceController.synthesize
);

// GET /api/voice/config - Get available languages, voices, and provider statuses
router.get('/config', requireAuth, VoiceController.getConfig);

export default router;
