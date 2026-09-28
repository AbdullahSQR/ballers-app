import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as ratingService from '../services/rating.service';
import { sendSuccess, sendError } from '../utils/response';

const submitRatingsSchema = z.object({
  ratings: z
    .array(
      z.object({
        user_id: z.string().uuid(),
        rating: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(3),
});

export const submitRatings = async (req: AuthRequest, res: Response) => {
  const parsed = submitRatingsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input');
    return;
  }

  const matchId = req.params.id as string;

  try {
    const result = await ratingService.submitRatings(req.user!.id, matchId, parsed.data.ratings);
    sendSuccess(res, result);
  } catch (err: any) {
    if (err.message === 'MATCH_NOT_FOUND') { sendError(res, 'MATCH_NOT_FOUND', 'Match not found', 404); return; }
    if (err.message === 'MATCH_NOT_COMPLETED') { sendError(res, 'MATCH_NOT_COMPLETED', 'You can only rate players after the match is completed', 400); return; }
    if (err.message === 'NOT_IN_MATCH') { sendError(res, 'NOT_IN_MATCH', 'You were not a participant in this match', 403); return; }
    if (err.message === 'ALREADY_RATED') { sendError(res, 'ALREADY_RATED', 'You have already submitted ratings for this match', 400); return; }
    if (err.message === 'INVALID_RATING_COUNT') { sendError(res, 'INVALID_RATING_COUNT', 'You must rate between 1 and 3 players', 400); return; }
    if (err.message === 'SELF_RATING') { sendError(res, 'SELF_RATING', 'You cannot rate yourself', 400); return; }
    if (err.message === 'NOT_TEAMMATE') { sendError(res, 'NOT_TEAMMATE', 'You can only rate your own teammates', 400); return; }
    if (err.message === 'INVALID_RATING_VALUE') { sendError(res, 'INVALID_RATING_VALUE', 'Ratings must be between 1 and 10', 400); return; }
    if (err.message === 'DUPLICATE_RATING') { sendError(res, 'DUPLICATE_RATING', 'You cannot rate the same player twice', 400); return; }
    sendError(res, 'SERVER_ERROR', 'Something went wrong', 500);
  }
};
