import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as teamService from '../services/team.service';
import { sendSuccess, sendError } from '../utils/response';

const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
  logo_url: z.string().url().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  logo_url: z.string().url().optional(),
});

const addMemberSchema = z.object({
  username: z.string().min(3).max(30),
});

export const getMyTeams = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await teamService.getMyTeams(req.user!.id);
    sendSuccess(res, teams);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const createTeam = async (req: AuthRequest, res: Response) => {
  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  try {
    const team = await teamService.createTeam(req.user!.id, parsed.data);
    sendSuccess(res, team, 201);
  } catch (err: any) {
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const getTeam = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.id as string;

  try {
    const team = await teamService.getTeam(teamId);
    sendSuccess(res, team);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Team not found', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const updateTeam = async (req: AuthRequest, res: Response) => {
  const parsed = updateTeamSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const teamId = req.params.id as string;

  try {
    const team = await teamService.updateTeam(teamId, req.user!.id, parsed.data);
    sendSuccess(res, team);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Team not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'Only the captain can do this', 403); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const teamId = req.params.id as string;

  try {
    const result = await teamService.addMember(teamId, req.user!.id, parsed.data.username);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Team not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'Only the captain can do this', 403); return; }
    if (err.message === 'USER_NOT_FOUND') { sendError(res, 'USER_NOT_FOUND', 'Player not found', 404); return; }
    if (err.message === 'ALREADY_MEMBER') { sendError(res, 'ALREADY_MEMBER', 'Player is already in the team', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.id as string;
  const userId = req.params.userId as string;

  try {
    const result = await teamService.removeMember(teamId, req.user!.id, userId);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Team not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'Only the captain can do this', 403); return; }
    if (err.message === 'CANNOT_REMOVE_CAPTAIN') { sendError(res, 'CANNOT_REMOVE_CAPTAIN', 'Captain cannot be removed', 400); return; }
    if (err.message === 'MEMBER_NOT_FOUND') { sendError(res, 'MEMBER_NOT_FOUND', 'This user is not in the team', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const leaveTeam = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.id as string;

  try {
    const result = await teamService.leaveTeam(teamId, req.user!.id);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Team not found', 404); return; }
    if (err.message === 'CAPTAIN_CANNOT_LEAVE') { sendError(res, 'CAPTAIN_CANNOT_LEAVE', 'Captains cannot leave. Disband the team instead.', 400); return; }
    if (err.message === 'NOT_A_MEMBER') { sendError(res, 'NOT_A_MEMBER', 'You are not a member of this team', 404); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};

export const disbandTeam = async (req: AuthRequest, res: Response) => {
  const teamId = req.params.id as string;

  try {
    const result = await teamService.disbandTeam(teamId, req.user!.id);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'TEAM_NOT_FOUND') { sendError(res, 'TEAM_NOT_FOUND', 'Team not found', 404); return; }
    if (err.message === 'FORBIDDEN') { sendError(res, 'FORBIDDEN', 'Only the captain can do this', 403); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
