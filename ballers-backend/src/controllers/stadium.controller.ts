import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as stadiumService from '../services/stadium.service';
import { sendSuccess, sendError } from '../utils/response';

const applySchema = z.object({
  stadium_name:     z.string().min(2).max(100),
  proposed_address: z.string().min(5).max(200),
  phone_number:     z.string().min(7).max(20).optional(),
  stadium_type:     z.string().max(50).optional(),
  notes:            z.string().max(1000).optional(),
});

const slotSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  status: z.enum(['available', 'blocked']).optional(),
});

const updateSlotSchema = z.object({
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  status: z.enum(['available', 'blocked']).optional(),
});

const createStadiumSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string().max(500).optional(),
  photo_url: z.string().url().optional(),
  manager_id: z.string().uuid().optional(),
});

const reviewSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
});

export const getAvailableSlots = async (req: AuthRequest, res: Response) => {
  const stadiumId = req.params.id as string;
  const date = req.query.date as string; // 'YYYY-MM-DD'

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    sendError(res, 'VALIDATION_ERROR', 'date query param required (YYYY-MM-DD)');
    return;
  }

  try {
    const slots = await stadiumService.getAvailableSlots(stadiumId, date);
    sendSuccess(res, slots);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getMyStadium = async (req: AuthRequest, res: Response) => {
  try {
    const stadium = await stadiumService.getMyStadium(req.user!.id);
    sendSuccess(res, stadium);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getStadiums = async (req: AuthRequest, res: Response) => {
  try {
    const stadiums = await stadiumService.getStadiums(req.user?.id);
    sendSuccess(res, stadiums);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getStadium = async (req: AuthRequest, res: Response) => {
  const stadiumId = req.params.id as string;

  try {
    const stadium = await stadiumService.getStadium(stadiumId);
    sendSuccess(res, stadium);
  } catch (err: any) {
    if (err.message === 'STADIUM_NOT_FOUND') { sendError(res, 'STADIUM_NOT_FOUND', 'Stadium not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const applyToManage = async (req: AuthRequest, res: Response) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const application = await stadiumService.applyToManage(req.user!.id, parsed.data);
    sendSuccess(res, application, 201);
  } catch (err: any) {
    if (err.message === 'APPLICATION_PENDING') { sendError(res, 'APPLICATION_PENDING', 'You already have a pending application', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const addTimeSlot = async (req: AuthRequest, res: Response) => {
  const parsed = slotSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const stadiumId = req.params.id as string;

  try {
    const slot = await stadiumService.addTimeSlot(req.user!.id, stadiumId, parsed.data);
    sendSuccess(res, slot, 201);
  } catch (err: any) {
    if (err.message === 'STADIUM_NOT_FOUND') { sendError(res, 'STADIUM_NOT_FOUND', 'Stadium not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'You do not manage this stadium', 403); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const updateTimeSlot = async (req: AuthRequest, res: Response) => {
  const parsed = updateSlotSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const stadiumId = req.params.id as string;
  const slotId = req.params.slotId as string;

  try {
    const slot = await stadiumService.updateTimeSlot(req.user!.id, stadiumId, slotId, parsed.data);
    sendSuccess(res, slot);
  } catch (err: any) {
    if (err.message === 'STADIUM_NOT_FOUND') { sendError(res, 'STADIUM_NOT_FOUND', 'Stadium not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'You do not manage this stadium', 403); return; }
    if (err.message === 'SLOT_NOT_FOUND') { sendError(res, 'SLOT_NOT_FOUND', 'Time slot not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const deleteTimeSlot = async (req: AuthRequest, res: Response) => {
  const stadiumId = req.params.id as string;
  const slotId = req.params.slotId as string;

  try {
    const result = await stadiumService.deleteTimeSlot(req.user!.id, stadiumId, slotId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'STADIUM_NOT_FOUND') { sendError(res, 'STADIUM_NOT_FOUND', 'Stadium not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'You do not manage this stadium', 403); return; }
    if (err.message === 'SLOT_NOT_FOUND') { sendError(res, 'SLOT_NOT_FOUND', 'Time slot not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await stadiumService.getApplications();
    sendSuccess(res, applications);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const reviewApplication = async (req: AuthRequest, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const applicationId = req.params.id as string;

  try {
    const result = await stadiumService.reviewApplication(req.user!.id, applicationId, parsed.data.decision);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'APPLICATION_NOT_FOUND') { sendError(res, 'APPLICATION_NOT_FOUND', 'Application not found', 404); return; }
    if (err.message === 'ALREADY_REVIEWED') { sendError(res, 'ALREADY_REVIEWED', 'This application has already been reviewed', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const createStadium = async (req: AuthRequest, res: Response) => {
  const parsed = createStadiumSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const stadium = await stadiumService.createStadium(parsed.data);
    sendSuccess(res, stadium, 201);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
