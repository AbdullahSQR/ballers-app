import { Router } from 'express';
import * as challengeController from '../controllers/challenge.controller';
import { requireAuth, requireVerified } from '../middleware/auth.middleware';

const router = Router();

// All challenge routes require auth + verified
router.use(requireAuth, requireVerified);

// POST /api/challenges — send a challenge to another team
router.post('/', challengeController.sendChallenge);

// GET /api/challenges — get all my sent/received challenges
router.get('/', challengeController.getChallenges);

// PUT /api/challenges/:id/accept — accept a challenge
router.put('/:id/accept', challengeController.acceptChallenge);

// PUT /api/challenges/:id/decline — decline a challenge
router.put('/:id/decline', challengeController.declineChallenge);

export default router;
