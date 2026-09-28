import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth, requireVerified } from '../middleware/auth.middleware';

const router = Router();

// GET /api/users/me — get my own profile
router.get('/me', requireAuth, userController.getMe);

// PUT /api/users/me — update username or avatar
router.put('/me', requireAuth, requireVerified, userController.updateMe);

// POST /api/users/me/onboarding — submit player profile
router.post('/me/onboarding', requireAuth, requireVerified, userController.onboarding);

// GET /api/users/me/matches — get my match history
router.get('/me/matches', requireAuth, userController.getMyMatches);

// GET /api/users/me/active-match — get current active open match (if any)
router.get('/me/active-match', requireAuth, userController.getMyActiveMatch);

// GET /api/users/:username — view another user's public profile
router.get('/:username', requireAuth, userController.getUserByUsername);

export default router;
