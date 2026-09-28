import prisma from '../config/database';

// ─── OVR Calculation ─────────────────────────────────────────────────────────

const calculateOvrDelta = (ratings: number[], matchesPlayed: number): number => {
  if (ratings.length === 0) return 0;

  let trimmed = [...ratings].sort((a, b) => a - b);
  if (trimmed.length >= 3) {
    trimmed = trimmed.slice(1, -1);
  }

  const avg = trimmed.reduce((sum, r) => sum + r, 0) / trimmed.length;

  const normalized = (avg - 5) / 5; // range: -1 to +1

  const dampener = Math.max(0.2, 1 - matchesPlayed / 100);

  const maxGain = 2.5;
  const maxLoss = 1.5;
  const raw = normalized * (normalized > 0 ? maxGain : maxLoss) * dampener;

  return Math.round(raw);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// ─── Submit Ratings ───────────────────────────────────────────────────────────

export const submitRatings = async (
  raterId: string,
  matchId: string,
  ratings: { user_id: string; rating: number }[]
) => {
  // Validate match exists and is completed
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  if (match.status !== 'completed') throw new Error('MATCH_NOT_COMPLETED');

  // Verify rater was a participant
  const raterParticipant = match.participants.find(p => p.user_id === raterId);
  if (!raterParticipant) throw new Error('NOT_IN_MATCH');

  // Check rater hasn't already submitted ratings for this match
  const existingRating = await prisma.matchRating.findFirst({
    where: { match_id: matchId, rater_id: raterId },
  });
  if (existingRating) throw new Error('ALREADY_RATED');

  // Validate: exactly 1–3 ratings, all must be teammates, no self-rating
  if (ratings.length < 1 || ratings.length > 3) throw new Error('INVALID_RATING_COUNT');

  const raterSide = raterParticipant.team_side;
  const teammates = match.participants.filter(
    p => p.user_id !== raterId && p.team_side === raterSide
  );
  const teammateIds = new Set(teammates.map(p => p.user_id));

  for (const r of ratings) {
    if (r.user_id === raterId) throw new Error('SELF_RATING');
    if (!teammateIds.has(r.user_id)) throw new Error('NOT_TEAMMATE');
    if (r.rating < 1 || r.rating > 10) throw new Error('INVALID_RATING_VALUE');
  }

  // Check for duplicate rated users in the submission
  const ratedIds = ratings.map(r => r.user_id);
  if (new Set(ratedIds).size !== ratedIds.length) throw new Error('DUPLICATE_RATING');

  // Save all ratings
  await prisma.matchRating.createMany({
    data: ratings.map(r => ({
      match_id: matchId,
      rater_id: raterId,
      rated_id: r.user_id,
      rating: r.rating,
    })),
  });

  // Update OVR for each rated player
  await Promise.all(ratings.map(r => updatePlayerOvr(r.user_id, matchId)));

  return { message: 'Ratings submitted successfully.' };
};

// ─── OVR Update ──────────────────────────────────────────────────────────────

const updatePlayerOvr = async (userId: string, matchId: string) => {
  const profile = await prisma.playerProfile.findUnique({ where: { user_id: userId } });
  if (!profile) return;

  // Get all ratings this player has received in this match
  const allRatings = await prisma.matchRating.findMany({
    where: { match_id: matchId, rated_id: userId },
    select: { rating: true },
  });

  if (allRatings.length === 0) return;

  const ratingValues = allRatings.map(r => r.rating);
  const delta = calculateOvrDelta(ratingValues, profile.matches_played);
  const newOvr = clamp(profile.ovr + delta, 40, 99);

  await prisma.playerProfile.update({
    where: { user_id: userId },
    data: { ovr: newOvr },
  });
};

// ─── Update Stats After Match ─────────────────────────────────────────────────
// Called when a match result is submitted

export const updateMatchStats = async (matchId: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });

  if (!match || match.home_score === null || match.away_score === null) return;

  const homeWon = match.home_score > match.away_score;
  const awayWon = match.away_score > match.home_score;
  const draw = match.home_score === match.away_score;

  for (const participant of match.participants) {
    const isHome = participant.team_side === 'home';
    const won = isHome ? homeWon : awayWon;
    const lost = isHome ? awayWon : homeWon;

    await prisma.playerProfile.updateMany({
      where: { user_id: participant.user_id },
      data: {
        matches_played: { increment: 1 },
        wins: won ? { increment: 1 } : undefined,
        draws: draw ? { increment: 1 } : undefined,
        losses: lost ? { increment: 1 } : undefined,
        goals_scored: { increment: participant.goals_scored },
      },
    });
  }

  // Update team stats if team_vs_team
  if (match.home_team_id && match.away_team_id) {
    await prisma.team.update({
      where: { id: match.home_team_id },
      data: {
        wins: homeWon ? { increment: 1 } : undefined,
        draws: draw ? { increment: 1 } : undefined,
        losses: awayWon ? { increment: 1 } : undefined,
      },
    });

    await prisma.team.update({
      where: { id: match.away_team_id },
      data: {
        wins: awayWon ? { increment: 1 } : undefined,
        draws: draw ? { increment: 1 } : undefined,
        losses: homeWon ? { increment: 1 } : undefined,
      },
    });
  }
};
