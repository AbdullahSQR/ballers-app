import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboard.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// GET /api/leaderboard/players — top 50 players by OVR
router.get('/players', requireAuth, leaderboardController.getTopPlayers);

// GET /api/leaderboard/teams — top 50 teams by OVR
router.get('/teams', requireAuth, leaderboardController.getTopTeams);

export default router;
