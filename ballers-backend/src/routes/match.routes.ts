import { Router } from 'express';
import * as matchController from '../controllers/match.controller';
import * as ratingController from '../controllers/rating.controller';
import { requireAuth, requireVerified } from '../middleware/auth.middleware';

const router = Router();

// All match routes require auth + verified email
router.use(requireAuth, requireVerified);

// POST /api/matches — create a match
router.post('/', matchController.createMatch);

// GET /api/matches — browse matches (filter by ?status=&match_type=)
router.get('/', matchController.getMatches);

// GET /api/matches/:id — get match details
router.get('/:id', matchController.getMatch);

// POST /api/matches/:id/join — join a match
router.post('/:id/join', matchController.joinMatch);

// DELETE /api/matches/:id/leave — leave a match
router.delete('/:id/leave', matchController.leaveMatch);

// PUT /api/matches/:id/result — submit final score (creator only)
router.put('/:id/result', matchController.submitResult);

// POST /api/matches/:id/invite — invite a player by username (creator only)
router.post('/:id/invite', matchController.invitePlayer);

// DELETE /api/matches/:id — cancel match (creator only)
router.delete('/:id', matchController.cancelMatch);

// POST /api/matches/:id/ratings — submit ratings for teammates after match
router.post('/:id/ratings', ratingController.submitRatings);

export default router;
