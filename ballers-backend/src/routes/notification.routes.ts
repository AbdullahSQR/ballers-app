import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require auth
router.use(requireAuth);

// GET /api/notifications — get all my notifications
router.get('/', notificationController.getNotifications);

// PUT /api/notifications/read-all — mark all as read (must be before /:id)
router.put('/read-all', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id — delete a notification
router.delete('/:id', notificationController.deleteNotification);

export default router;
