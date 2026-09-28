import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as leaderboardService from '../services/leaderboard.service';
import { sendSuccess, sendError } from '../utils/response';

export const getTopPlayers = async (req: AuthRequest, res: Response) => {
  try {
    const players = await leaderboardService.getTopPlayers();
    sendSuccess(res, players);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getTopTeams = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await leaderboardService.getTopTeams();
    sendSuccess(res, teams);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
