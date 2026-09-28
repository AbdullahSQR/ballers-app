import prisma from '../config/database';

export const getTopPlayers = async () => {
  const profiles = await prisma.playerProfile.findMany({
    orderBy: { ovr: 'desc' },
    take: 50,
    include: {
      user: { select: { id: true, username: true, avatar_url: true } },
    },
  });

  return profiles.map((p, index) => ({
    rank: index + 1,
    user: p.user,
    position: p.position,
    skill_level: p.skill_level,
    ovr: p.ovr,
    matches_played: p.matches_played,
    wins: p.wins,
    draws: p.draws,
    losses: p.losses,
    goals_scored: p.goals_scored,
  }));
};

export const getTopTeams = async () => {
  const teams = await prisma.team.findMany({
    orderBy: { ovr: 'desc' },
    take: 50,
    include: {
      captain: { select: { id: true, username: true, avatar_url: true } },
      _count: { select: { members: true } },
    },
  });

  return teams.map((t, index) => ({
    rank: index + 1,
    id: t.id,
    name: t.name,
    logo_url: t.logo_url,
    captain: t.captain,
    ovr: t.ovr,
    wins: t.wins,
    draws: t.draws,
    losses: t.losses,
    member_count: t._count.members,
  }));
};
