import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import agentRoutes from './routes/agent.routes.js';
import tripRoutes from './routes/trip.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { getActiveProvider, isLLMConfigured } from './agent/llm.client.js';

export function createApp(): Express {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));

  // Health Check Endpoints
  const healthHandler = (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      service: 'TripPilot AI Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      agentEngine: 'active',
      aiProvider: getActiveProvider().provider,
      aiConfigured: isLLMConfigured(),
      environment: env.NODE_ENV
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Root Service Status
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      service: 'TripPilot AI Agentic Backend',
      status: 'healthy',
      docs: '/api/docs',
      health: '/health',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Endpoints
  app.use('/api', agentRoutes);
  app.use('/api/trips', tripRoutes);
  app.use('/api/integrations', integrationRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Endpoint ${req.method} ${req.url} does not exist.`
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
