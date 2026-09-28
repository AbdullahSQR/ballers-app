import prisma from '../config/database';

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      email_verified: true,
      avatar_url: true,
      created_at: true,
      player_profile: true,
    },
  });

  if (!user) throw new Error('USER_NOT_FOUND');
  return user;
};

export const updateMe = async (userId: string, data: { username?: string; avatar_url?: string }) => {
  if (data.username) {
    const taken = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: userId } },
    });
    if (taken) throw new Error('USERNAME_TAKEN');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      username: true,
      avatar_url: true,
      role: true,
      email_verified: true,
    },
  });

  return user;
};

export const onboarding = async (
  userId: string,
  data: {
    position: string;
    alternative_position?: string;
    skill_level: string;
    availability: object;
    playstyle: string;
    goals: string;
    latitude?: number;
    longitude?: number;
  }
) => {
  const profile = await prisma.playerProfile.upsert({
    where: { user_id: userId },
    update: data as any,
    create: { user_id: userId, ...data } as any,
  });

  return profile;
};

export const getMyMatches = async (userId: string) => {
  const participations = await prisma.matchParticipant.findMany({
    where: { user_id: userId },
    include: {
      match: {
        include: {
          home_team: { select: { name: true } },
          away_team: { select: { name: true } },
          stadium: { select: { name: true } },
        },
      },
    },
    orderBy: { match: { scheduled_at: 'desc' } },
  });

  return participations.map(p => ({
    id: p.match.id,
    date: p.match.scheduled_at,
    team_side: p.team_side,
    home_score: p.match.home_score,
    away_score: p.match.away_score,
    status: p.match.status,
    home_team: p.match.home_team?.name ?? 'Home',
    away_team: p.match.away_team?.name ?? 'Away',
    stadium: p.match.stadium?.name ?? null,
    goals_scored: p.goals_scored,
  }));
};

export const getMyActiveMatch = async (userId: string) => {
  const ACTIVE_STATUSES = ['pending', 'filling', 'ready'] as const;

  const MATCH_INCLUDE = {
    stadium:      { select: { id: true, name: true, address: true } },
    participants: {
      include: {
        user: { select: { id: true, username: true, avatar_url: true } },
      },
    },
  } as const;

  const formatParticipants = (participants: any[]) =>
    participants.map(p => ({
      user_id:         p.user_id,
      username:        p.user.username,
      avatar_url:      p.user.avatar_url ?? null,
      team_side:       p.team_side,
      position_played: p.position_played,
    }));

  // 1 — Check participations first (joined via matchmaking or invite)
  const participation = await prisma.matchParticipant.findFirst({
    where: { user_id: userId, match: { status: { in: [...ACTIVE_STATUSES] } } },
    include: { match: { include: MATCH_INCLUDE } },
  });

  if (participation) {
    const match = participation.match;
    return {
      id:             match.id,
      match_type:     match.match_type,
      status:         match.status,
      scheduled_at:   match.scheduled_at,
      max_players:    match.max_players,
      players_joined: match.participants.length,
      team_side:      participation.team_side,
      stadium:        match.stadium,
      is_creator:     match.creator_id === userId,
      participants:   formatParticipants(match.participants),
    };
  }

  // 2 — Check matches the user created but isn't a participant of (e.g. friendly matches)
  const created = await prisma.match.findFirst({
    where: { creator_id: userId, status: { in: [...ACTIVE_STATUSES] } },
    include: MATCH_INCLUDE,
    orderBy: { created_at: 'desc' },
  });

  if (created) {
    return {
      id:             created.id,
      match_type:     created.match_type,
      status:         created.status,
      scheduled_at:   created.scheduled_at,
      max_players:    created.max_players,
      players_joined: created.participants.length,
      team_side:      'home' as const,
      stadium:        created.stadium,
      is_creator:     true,
      participants:   formatParticipants(created.participants),
    };
  }

  return null;
};

export const getUserByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatar_url: true,
      role: true,
      created_at: true,
      player_profile: {
        select: {
          position: true,
          alternative_position: true,
          skill_level: true,
          playstyle: true,
          goals: true,
          ovr: true,
          matches_played: true,
          wins: true,
          draws: true,
          losses: true,
          goals_scored: true,
        },
      },
    },
  });

  if (!user) throw new Error('USER_NOT_FOUND');
  return user;
};
