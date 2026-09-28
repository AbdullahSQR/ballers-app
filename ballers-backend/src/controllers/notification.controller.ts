import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as notificationService from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/response';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await notificationService.getNotifications(req.user!.id);
    sendSuccess(res, notifications);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const notificationId = req.params.id as string;

  try {
    const result = await notificationService.markAsRead(req.user!.id, notificationId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'NOTIFICATION_NOT_FOUND') { sendError(res, 'NOTIFICATION_NOT_FOUND', 'Notification not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'This notification does not belong to you', 403); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead(req.user!.id);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  const notificationId = req.params.id as string;

  try {
    const result = await notificationService.deleteNotification(req.user!.id, notificationId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'NOTIFICATION_NOT_FOUND') { sendError(res, 'NOTIFICATION_NOT_FOUND', 'Notification not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'This notification does not belong to you', 403); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
