import { Router } from 'express';
import * as stadiumController from '../controllers/stadium.controller';
import { requireAuth, requireVerified, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/stadiums/my — get the stadium managed by the current user
router.get('/my', requireAuth, requireRole('stadium_manager'), stadiumController.getMyStadium);

// GET /api/stadiums — browse approved stadiums (auth required)
router.get('/', requireAuth, stadiumController.getStadiums);

// GET /api/stadiums/:id — get stadium + time slots
router.get('/:id', requireAuth, stadiumController.getStadium);

// GET /api/stadiums/:id/available-slots?date=YYYY-MM-DD
router.get('/:id/available-slots', requireAuth, stadiumController.getAvailableSlots);

// POST /api/stadiums/apply — apply to become a stadium manager
router.post('/apply', requireAuth, requireVerified, stadiumController.applyToManage);

// ─── Stadium Manager routes ───────────────────────────────────────────────────

// POST /api/stadiums/:id/slots — add a time slot
router.post('/:id/slots', requireAuth, requireVerified, requireRole('stadium_manager'), stadiumController.addTimeSlot);

// PUT /api/stadiums/:id/slots/:slotId — update a time slot
router.put('/:id/slots/:slotId', requireAuth, requireVerified, requireRole('stadium_manager'), stadiumController.updateTimeSlot);

// DELETE /api/stadiums/:id/slots/:slotId — remove a time slot
router.delete('/:id/slots/:slotId', requireAuth, requireVerified, requireRole('stadium_manager'), stadiumController.deleteTimeSlot);

// ─── Admin routes ─────────────────────────────────────────────────────────────

// GET /api/stadiums/admin/applications — view pending applications
router.get('/admin/applications', requireAuth, requireRole('admin'), stadiumController.getApplications);

// PUT /api/stadiums/admin/applications/:id — approve or reject
router.put('/admin/applications/:id', requireAuth, requireRole('admin'), stadiumController.reviewApplication);

// POST /api/stadiums/admin/create — create a stadium directly
router.post('/admin/create', requireAuth, requireRole('admin'), stadiumController.createStadium);

export default router;
