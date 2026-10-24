import { Router } from 'express';
import { IntegrationController } from '../controllers/integration.controller.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(apiRateLimiter);

// GET /api/integrations/places/search
router.get('/places/search', IntegrationController.searchPlaces);

// GET /api/integrations/places/by-topic
router.get('/places/by-topic', IntegrationController.getVenuesByTopic);

// GET /api/integrations/accommodations
router.get('/accommodations', IntegrationController.getAccommodations);

// GET /api/integrations/weather
router.get('/weather', IntegrationController.getWeather);

// POST /api/integrations/routes/calculate
router.post('/routes/calculate', IntegrationController.calculateRoute);

// GET /api/integrations/currency/convert
router.get('/currency/convert', IntegrationController.convertCurrency);

export default router;
