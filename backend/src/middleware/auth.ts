import { Request, Response, NextFunction } from 'express';
import { getAdminSupabase } from '../db/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Authentication Middleware
 * Enforces Supabase Auth JWT tokens.
 * For local development and testing, supports x-user-id header or mock test user.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const devUserIdHeader = req.headers['x-user-id'] as string;

  // 1. Check for development test override header
  if (devUserIdHeader) {
    req.user = {
      id: devUserIdHeader,
      email: `${devUserIdHeader}@dev.trippilot.test`
    };
    return next();
  }

  // 2. Validate Bearer JWT token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development without auth header, fall back to default demo user
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'alice@trippilot.test'
      };
      return next();
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing. Please provide "Authorization: Bearer <token>".'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // In test or local mock mode with mock token
  if (token === 'mock-test-token' || token === 'mock-anon-key-for-development') {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'alice@trippilot.test'
    };
    return next();
  }

  try {
    const supabase = getAdminSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token.'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email
    };
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'Authentication failed.'
    });
  }
}
