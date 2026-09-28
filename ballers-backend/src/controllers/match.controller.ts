import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as matchService from '../services/match.service';
import { sendSuccess, sendError } from '../utils/response';

const createMatchSchema = z.object({
  match_type:   z.enum(['open', 'team_vs_team', 'friendly']),
  scheduled_at: z.string().datetime(),
  max_players:  z.number().int().min(2).max(22).optional(),
  stadium_id:   z.string().uuid().optional(),
  home_team_id: z.string().uuid().optional(),
  away_team_id: z.string().uuid().optional(),
});

const resultSchema = z.object({
  home_score: z.number().int().min(0),
  away_score: z.number().int().min(0),
});

export const createMatch = async (req: AuthRequest, res: Response) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const match = await matchService.createMatch(req.user!.id, parsed.data);
    sendSuccess(res, match, 201);
  } catch (err: any) {
    if (err.message === 'SLOT_UNAVAILABLE') {
      sendError(res, 'SLOT_UNAVAILABLE', 'That time slot is no longer available', 409);
      return;
    }
    console.error('[createMatch]', err?.message ?? err);
    sendError(res, 'SERVER_ERROR', err?.message ?? 'Something went wrong', 500);
  }
};

export const getMatches = async (req: AuthRequest, res: Response) => {
  const { status, match_type } = req.query;

  try {
    const matches = await matchService.getMatches({
      status: status as string | undefined,
      match_type: match_type as string | undefined,
    });
    sendSuccess(res, matches);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getMatch = async (req: AuthRequest, res: Response) => {
  const matchId = req.params.id as string;

  try {
    const match = await matchService.getMatch(matchId);
    sendSuccess(res, match);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND') { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const joinMatch = async (req: AuthRequest, res: Response) => {
  const matchId = req.params.id as string;

  try {
    const result = await matchService.joinMatch(req.user!.id, matchId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND') { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    if (err.message === 'MATCH_UNAVAILABLE') { sendError(res, 'MATCH_UNAVAILABLE', 'This match is no longer available', 400); return; }
    if (err.message === 'MATCH_FULL') { sendError(res, 'MATCH_FULL', 'This match is already full', 400); return; }
    if (err.message === 'ALREADY_JOINED') { sendError(res, 'ALREADY_JOINED', 'You have already joined this match', 400); return; }
    if (err.message === 'NO_PROFILE') { sendError(res, 'NO_PROFILE', 'You need to complete your player profile first', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const leaveMatch = async (req: AuthRequest, res: Response) => {
  const matchId = req.params.id as string;

  try {
    const result = await matchService.leaveMatch(req.user!.id, matchId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND') { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    if (err.message === 'MATCH_UNAVAILABLE') { sendError(res, 'MATCH_UNAVAILABLE', 'Cannot leave a completed or cancelled match', 400); return; }
    if (err.message === 'NOT_IN_MATCH') { sendError(res, 'NOT_IN_MATCH', 'You are not in this match', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const submitResult = async (req: AuthRequest, res: Response) => {
  const parsed = resultSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const matchId = req.params.id as string;

  try {
    const result = await matchService.submitResult(req.user!.id, matchId, parsed.data);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND') { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'Only the match creator can submit the result', 403); return; }
    if (err.message === 'MATCH_NOT_READY') { sendError(res, 'MATCH_NOT_READY', 'Match is not in a valid state to submit results', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const cancelMatch = async (req: AuthRequest, res: Response) => {
  const matchId = req.params.id as string;

  try {
    const result = await matchService.cancelMatch(req.user!.id, matchId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND') { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'Only the match creator can cancel it', 403); return; }
    if (err.message === 'MATCH_UNAVAILABLE') { sendError(res, 'MATCH_UNAVAILABLE', 'Match is already completed or cancelled', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const invitePlayer = async (req: AuthRequest, res: Response) => {
  const parsed = z.object({ username: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', 'username is required');
    return;
  }

  const matchId = req.params.id as string;

  try {
    const result = await matchService.invitePlayer(req.user!.id, matchId, parsed.data.username);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND')     { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    if (err.message === 'FORBIDDEN')           { sendError(res, 'FORBIDDEN', 'Only the match creator can send invites', 403); return; }
    if (err.message === 'MATCH_UNAVAILABLE')   { sendError(res, 'MATCH_UNAVAILABLE', 'Match is not active', 400); return; }
    if (err.message === 'USER_NOT_FOUND')      { sendError(res, 'USER_NOT_FOUND', 'Player not found', 404); return; }
    if (err.message === 'CANNOT_INVITE_SELF')  { sendError(res, 'CANNOT_INVITE_SELF', 'You cannot invite yourself', 400); return; }
    if (err.message === 'ALREADY_IN_MATCH')    { sendError(res, 'ALREADY_IN_MATCH', 'Player is already in this match', 400); return; }
    if (err.message === 'ALREADY_INVITED')     { sendError(res, 'ALREADY_INVITED', 'Player has already been invited', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
