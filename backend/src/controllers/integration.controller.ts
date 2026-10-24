import { Request, Response } from 'express';
import { PlacesAdapter } from '../integrations/places.adapter.js';
import { WeatherAdapter } from '../integrations/weather.adapter.js';
import { RoutesAdapter } from '../integrations/routes.adapter.js';
import { CurrencyAdapter } from '../integrations/currency.adapter.js';

export class IntegrationController {
  /**
   * GET /api/integrations/places/search
   * Supports destination, query, single category, or multiple categories (categories=beaches,restaurants,historical_places).
   * Guarantees at least 10 relevant places per category whenever sufficient results are available.
   */
  static async searchPlaces(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.query as string) || '';
      const destination = req.query.destination as string;
      const category = req.query.category as string | undefined;
      const rawCategories = req.query.categories;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 14;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

      if (!destination) {
        res.status(400).json({ error: 'Missing destination parameter' });
        return;
      }

      let categoriesList: string[] | undefined;
      if (Array.isArray(rawCategories)) {
        categoriesList = rawCategories.map(String).map(s => s.trim()).filter(Boolean);
      } else if (typeof rawCategories === 'string' && rawCategories.trim() !== '') {
        categoriesList = rawCategories.split(',').map(s => s.trim()).filter(Boolean);
      } else if (category && category.includes(',')) {
        categoriesList = category.split(',').map(s => s.trim()).filter(Boolean);
      }

      const result = await PlacesAdapter.searchPlaces(
        query || 'top highlights',
        destination,
        category,
        limit,
        lat,
        lng,
        categoriesList
      );

      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Place Search Failed', message: err.message });
    }
  }

  /**
   * GET /api/integrations/places/by-topic
   */
  static async getVenuesByTopic(req: Request, res: Response): Promise<void> {
    try {
      const destination = req.query.destination as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

      if (!destination) {
        res.status(400).json({ error: 'Missing destination parameter' });
        return;
      }

      const topics = await PlacesAdapter.getCuratedVenuesByTopic(destination, limit);
      res.status(200).json({ destination, topics });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch curated venues by topic', message: err.message });
    }
  }

  /**
   * GET /api/integrations/weather
   */
  static async getWeather(req: Request, res: Response): Promise<void> {
    try {
      const destination = req.query.destination as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

      if (!destination || !startDate || !endDate) {
        res.status(400).json({ error: 'destination, startDate, and endDate parameters are required' });
        return;
      }

      const result = await WeatherAdapter.getForecast(destination, startDate, endDate, lat, lng);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Weather Fetch Failed', message: err.message });
    }
  }

  /**
   * POST /api/integrations/routes/calculate
   */
  static async calculateRoute(req: Request, res: Response): Promise<void> {
    try {
      const { origin, destination, transportMode, originCoords, destinationCoords } = req.body;

      if (!origin || !destination) {
        res.status(400).json({ error: 'origin and destination are required' });
        return;
      }

      const result = await RoutesAdapter.calculateRoute(
        origin,
        destination,
        transportMode,
        originCoords,
        destinationCoords
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Route Calculation Failed', message: err.message });
    }
  }

  /**
   * GET /api/integrations/currency/convert
   */
  static async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const from = (req.query.from as string) || 'USD';
      const to = (req.query.to as string) || 'EUR';
      const amount = req.query.amount ? parseFloat(req.query.amount as string) : 1;

      const result = await CurrencyAdapter.convert(amount, from, to);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Currency Conversion Failed', message: err.message });
    }
  }
}
