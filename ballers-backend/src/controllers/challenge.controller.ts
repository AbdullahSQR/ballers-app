import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as challengeService from '../services/challenge.service';
import { sendSuccess, sendError } from '../utils/response';

const sendChallengeSchema = z.object({
  my_team_id: z.string().uuid(),
  opponent_team_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
});

const acceptChallengeSchema = z.object({
  scheduled_at: z.string().datetime(),
});

export const sendChallenge = async (req: AuthRequest, res: Response) => {
  const parsed = sendChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const challenge = await challengeService.sendChallenge(req.user!.id, parsed.data);
    sendSuccess(res, challenge, 201);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Your team was not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'You are not the captain of this team', 403); return; }
    if (err.message === 'OPPONENT_NOT_FOUND') { sendError(res, 'OPPONENT_NOT_FOUND', 'Opponent team not found', 404); return; }
    if (err.message === 'SAME_TEAM') { sendError(res, 'SAME_TEAM', 'You cannot challenge your own team', 400); return; }
    if (err.message === 'CHALLENGE_PENDING') { sendError(res, 'CHALLENGE_PENDING', 'A challenge is already pending against this team', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const challenges = await challengeService.getChallenges(req.user!.id);
    sendSuccess(res, challenges);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const acceptChallenge = async (req: AuthRequest, res: Response) => {
  const parsed = acceptChallengeSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const challengeId = req.params.id as string;

  try {
    const result = await challengeService.acceptChallenge(req.user!.id, challengeId, parsed.data.scheduled_at);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'CHALLENGE_NOT_FOUND') { sendError(res, 'CHALLENGE_NOT_FOUND', 'Challenge not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'This challenge was not sent to you', 403); return; }
    if (err.message === 'CHALLENGE_UNAVAILABLE') { sendError(res, 'CHALLENGE_UNAVAILABLE', 'This challenge is no longer pending', 400); return; }
    if (err.message === 'NO_TEAM') { sendError(res, 'NO_TEAM', 'You are not a captain of any team', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const declineChallenge = async (req: AuthRequest, res: Response) => {
  const challengeId = req.params.id as string;

  try {
    const result = await challengeService.declineChallenge(req.user!.id, challengeId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'CHALLENGE_NOT_FOUND') { sendError(res, 'CHALLENGE_NOT_FOUND', 'Challenge not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'This challenge was not sent to you', 403); return; }
    if (err.message === 'CHALLENGE_UNAVAILABLE') { sendError(res, 'CHALLENGE_UNAVAILABLE', 'This challenge is no longer pending', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
