import prisma from '../config/database';

export const getMyTeams = async (userId: string) => {
  const memberships = await prisma.teamMember.findMany({
    where: { user_id: userId },
    include: {
      team: {
        include: {
          captain: { select: { id: true, username: true } },
          _count: { select: { members: true } },
        },
      },
    },
  });

  return memberships.map(m => ({
    id: m.team.id,
    name: m.team.name,
    logo_url: m.team.logo_url,
    captain: m.team.captain,
    is_captain: m.team.captain_id === userId,
    member_count: m.team._count.members,
    ovr: m.team.ovr,
    wins: m.team.wins,
    draws: m.team.draws,
    losses: m.team.losses,
  }));
};

export const leaveTeam = async (teamId: string, userId: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error('TEAM_NOT_FOUND');
  if (team.captain_id === userId) throw new Error('CAPTAIN_CANNOT_LEAVE');

  const member = await prisma.teamMember.findUnique({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
  });
  if (!member) throw new Error('NOT_A_MEMBER');

  await prisma.teamMember.delete({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
  });

  return { message: 'You have left the team.' };
};

export const createTeam = async (captainId: string, data: { name: string; logo_url?: string }) => {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      logo_url: data.logo_url,
      captain_id: captainId,
      members: {
        create: { user_id: captainId },
      },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, avatar_url: true } },
        },
      },
    },
  });

  return team;
};

export const getTeam = async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      captain: { select: { id: true, username: true, avatar_url: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              player_profile: { select: { position: true, ovr: true } },
            },
          },
        },
      },
    },
  });

  if (!team) throw new Error('TEAM_NOT_FOUND');
  return team;
};

export const updateTeam = async (
  teamId: string,
  captainId: string,
  data: { name?: string; logo_url?: string }
) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) throw new Error('TEAM_NOT_FOUND');
  if (team.captain_id !== captainId) throw new Error('FORBIDDEN');

  return prisma.team.update({
    where: { id: teamId },
    data,
  });
};

export const addMember = async (teamId: string, captainId: string, username: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) throw new Error('TEAM_NOT_FOUND');
  if (team.captain_id !== captainId) throw new Error('FORBIDDEN');

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) throw new Error('USER_NOT_FOUND');

  const alreadyMember = await prisma.teamMember.findUnique({
    where: { team_id_user_id: { team_id: teamId, user_id: targetUser.id } },
  });
  if (alreadyMember) throw new Error('ALREADY_MEMBER');

  await prisma.teamMember.create({
    data: { team_id: teamId, user_id: targetUser.id },
  });

  return { message: `${targetUser.username} added to the team.` };
};

export const removeMember = async (teamId: string, captainId: string, userId: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) throw new Error('TEAM_NOT_FOUND');
  if (team.captain_id !== captainId) throw new Error('FORBIDDEN');
  if (userId === captainId) throw new Error('CANNOT_REMOVE_CAPTAIN');

  const member = await prisma.teamMember.findUnique({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
  });
  if (!member) throw new Error('MEMBER_NOT_FOUND');

  await prisma.teamMember.delete({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
  });

  return { message: 'Member removed.' };
};

export const disbandTeam = async (teamId: string, captainId: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });

  if (!team) throw new Error('TEAM_NOT_FOUND');
  if (team.captain_id !== captainId) throw new Error('FORBIDDEN');

  await prisma.team.delete({ where: { id: teamId } });

  return { message: 'Team disbanded.' };
};
