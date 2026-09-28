import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as matchmakingService from '../services/matchmaking.service';
import { sendSuccess, sendError } from '../utils/response';

export const findMatch = async (req: AuthRequest, res: Response) => {
  try {
    const result = await matchmakingService.findMatch(req.user!.id);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'NO_PROFILE') { sendError(res, 'NO_PROFILE', 'You need to complete your player profile before finding a match', 400); return; }
    if (err.message === 'ALREADY_IN_MATCH') { sendError(res, 'ALREADY_IN_MATCH', 'You are already in an active match', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
