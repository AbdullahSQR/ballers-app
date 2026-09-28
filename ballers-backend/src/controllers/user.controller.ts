import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as userService from '../services/user.service';
import { sendSuccess, sendError } from '../utils/response';

const updateMeSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  avatar_url: z.string().optional(),
});

const onboardingSchema = z.object({
  position: z.enum(['GK', 'DEF', 'MID', 'ATT']),
  alternative_position: z.enum(['GK', 'DEF', 'MID', 'ATT']).optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced']),
  availability: z.record(z.string(), z.any()),
  playstyle: z.string().min(1).max(300),
  goals: z.string().min(1).max(300),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') { sendError(res, 'USER_NOT_FOUND', 'User not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  const parsed = updateMeSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const user = await userService.updateMe(req.user!.id, parsed.data);
    sendSuccess(res, user);
  } catch (err: any) {
    if (err.message === 'USERNAME_TAKEN') { sendError(res, 'USERNAME_TAKEN', 'This username is already taken'); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const onboarding = async (req: AuthRequest, res: Response) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const profile = await userService.onboarding(req.user!.id, parsed.data);
    sendSuccess(res, { message: 'Profile saved successfully.', profile });
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getMyMatches = async (req: AuthRequest, res: Response) => {
  try {
    const matches = await userService.getMyMatches(req.user!.id);
    sendSuccess(res, matches);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getMyActiveMatch = async (req: AuthRequest, res: Response) => {
  try {
    const match = await userService.getMyActiveMatch(req.user!.id);
    sendSuccess(res, match);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getUserByUsername = async (req: AuthRequest, res: Response) => {
  const username = req.params.username as string;

  try {
    const user = await userService.getUserByUsername(username);
    sendSuccess(res, user);
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') { sendError(res, 'USER_NOT_FOUND', 'User not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
