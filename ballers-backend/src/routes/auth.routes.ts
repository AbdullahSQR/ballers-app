import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

const router = Router();

// POST /api/auth/register
router.post('/register', authController.register);

// GET /api/auth/verify-email?token=...
router.get('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authController.resendVerification);

// POST /api/auth/login
router.post('/login', authController.login);

export default router;
