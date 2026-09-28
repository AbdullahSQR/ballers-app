import { Router } from 'express';
import * as matchmakingController from '../controllers/matchmaking.controller';
import { requireAuth, requireVerified } from '../middleware/auth.middleware';

const router = Router();

// POST /api/matchmaking/find — auto-place player in the best open match
router.post('/find', requireAuth, requireVerified, matchmakingController.findMatch);

export default router;
