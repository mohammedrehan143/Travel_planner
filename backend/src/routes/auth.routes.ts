import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/confirm-user
router.post('/confirm-user', AuthController.confirmUser);

// POST /api/auth/lookup-identifier
router.post('/lookup-identifier', AuthController.lookupIdentifier);

export default router;
