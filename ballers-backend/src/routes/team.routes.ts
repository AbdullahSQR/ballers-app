import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { requireAuth, requireVerified } from '../middleware/auth.middleware';

const router = Router();

// All team routes require auth + verified email
router.use(requireAuth, requireVerified);

// GET /api/teams — get all teams the current user belongs to
router.get('/', teamController.getMyTeams);

// POST /api/teams — create a team
router.post('/', teamController.createTeam);

// GET /api/teams/:id — get team details
router.get('/:id', teamController.getTeam);

// PUT /api/teams/:id — update team (captain only)
router.put('/:id', teamController.updateTeam);

// POST /api/teams/:id/members — add a member (captain only)
router.post('/:id/members', teamController.addMember);

// DELETE /api/teams/:id/members/:userId — remove a member (captain only)
router.delete('/:id/members/:userId', teamController.removeMember);

// DELETE /api/teams/:id/leave — leave a team (member only, not captain)
router.delete('/:id/leave', teamController.leaveTeam);

// DELETE /api/teams/:id — disband team (captain only)
router.delete('/:id', teamController.disbandTeam);

export default router;
