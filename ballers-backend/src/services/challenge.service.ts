import prisma from '../config/database';

export const sendChallenge = async (
  senderId: string,
  data: {
    my_team_id: string;
    opponent_team_id: string;
    scheduled_at: string;
  }
) => {
  // Verify sender is captain of their team
  const myTeam = await prisma.team.findUnique({ where: { id: data.my_team_id } });
  if (!myTeam) throw new Error('TEAM_NOT_FOUND');
  if (myTeam.captain_id !== senderId) throw new Error('FORBIDDEN');

  // Get the opponent team and their captain
  const opponentTeam = await prisma.team.findUnique({ where: { id: data.opponent_team_id } });
  if (!opponentTeam) throw new Error('OPPONENT_NOT_FOUND');

  // Can't challenge your own team
  if (data.my_team_id === data.opponent_team_id) throw new Error('SAME_TEAM');

  // Check no pending challenge already exists between these two teams
  const existing = await prisma.invitation.findFirst({
    where: {
      type: 'team_challenge',
      team_id: data.my_team_id,
      recipient_id: opponentTeam.captain_id,
      status: 'pending',
    },
  });
  if (existing) throw new Error('CHALLENGE_PENDING');

  const challenge = await prisma.invitation.create({
    data: {
      type: 'team_challenge',
      sender_id: senderId,
      recipient_id: opponentTeam.captain_id,
      team_id: data.my_team_id,
      status: 'pending',
    },
    include: {
      sender: { select: { id: true, username: true } },
      recipient: { select: { id: true, username: true } },
      team: { select: { id: true, name: true } },
    },
  });

  // Notify opponent captain
  await prisma.notification.create({
    data: {
      user_id: opponentTeam.captain_id,
      type: 'challenge',
      title: 'New Challenge!',
      body: `${myTeam.name} has challenged your team to a match.`,
      related_entity_id: challenge.id,
    },
  });

  return challenge;
};

export const getChallenges = async (userId: string) => {
  // Get all challenges sent or received by this user
  const challenges = await prisma.invitation.findMany({
    where: {
      type: 'team_challenge',
      OR: [{ sender_id: userId }, { recipient_id: userId }],
    },
    include: {
      sender: { select: { id: true, username: true, avatar_url: true } },
      recipient: { select: { id: true, username: true, avatar_url: true } },
      team: { select: { id: true, name: true, logo_url: true } },
      match: { select: { id: true, scheduled_at: true, status: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return challenges;
};

export const acceptChallenge = async (userId: string, challengeId: string, scheduled_at: string) => {
  const challenge = await prisma.invitation.findUnique({
    where: { id: challengeId },
    include: { team: true },
  });

  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  if (challenge.recipient_id !== userId) throw new Error('FORBIDDEN');
  if (challenge.status !== 'pending') throw new Error('CHALLENGE_UNAVAILABLE');

  // Find the recipient's team
  const recipientTeam = await prisma.team.findFirst({ where: { captain_id: userId } });
  if (!recipientTeam) throw new Error('NO_TEAM');

  // Create the match
  const match = await prisma.match.create({
    data: {
      creator_id: userId,
      match_type: 'team_vs_team',
      scheduled_at: new Date(scheduled_at),
      status: 'filling',
      home_team_id: challenge.team_id,
      away_team_id: recipientTeam.id,
    },
  });

  // Update challenge status and link the match
  await prisma.invitation.update({
    where: { id: challengeId },
    data: {
      status: 'accepted',
      responded_at: new Date(),
      match_id: match.id,
    },
  });

  // Notify the challenger
  await prisma.notification.create({
    data: {
      user_id: challenge.sender_id,
      type: 'challenge',
      title: 'Challenge Accepted!',
      body: `${recipientTeam.name} accepted your challenge. The match is on!`,
      related_entity_id: match.id,
    },
  });

  return { message: 'Challenge accepted. Match created!', match_id: match.id };
};

export const declineChallenge = async (userId: string, challengeId: string) => {
  const challenge = await prisma.invitation.findUnique({ where: { id: challengeId } });

  if (!challenge) throw new Error('CHALLENGE_NOT_FOUND');
  if (challenge.recipient_id !== userId) throw new Error('FORBIDDEN');
  if (challenge.status !== 'pending') throw new Error('CHALLENGE_UNAVAILABLE');

  await prisma.invitation.update({
    where: { id: challengeId },
    data: { status: 'declined', responded_at: new Date() },
  });

  // Notify the challenger
  await prisma.notification.create({
    data: {
      user_id: challenge.sender_id,
      type: 'challenge',
      title: 'Challenge Declined',
      body: 'Your team challenge was declined.',
      related_entity_id: challengeId,
    },
  });

  return { message: 'Challenge declined.' };
};
