import prisma from '../config/database';
import { MatchStatus } from '@prisma/client';
import { updateMatchStats } from './rating.service';

export const createMatch = async (
  creatorId: string,
  data: {
    match_type: string;
    scheduled_at: string;
    max_players?: number;
    stadium_id?: string;
    home_team_id?: string;
    away_team_id?: string;
  }
) => {
  // Book the slot first (if stadium + time provided)
  let time_slot_id: string | undefined;

  if (data.stadium_id && data.scheduled_at) {
    const slotStart    = new Date(data.scheduled_at);
    const existingSlot = await prisma.timeSlot.findFirst({
      where: { stadium_id: data.stadium_id, start_time: slotStart },
    });

    if (existingSlot) {
      if (existingSlot.status !== 'available') throw new Error('SLOT_UNAVAILABLE');
      await prisma.timeSlot.update({ where: { id: existingSlot.id }, data: { status: 'booked' } });
      time_slot_id = existingSlot.id;
    } else {
      const newSlot = await prisma.timeSlot.create({
        data: {
          stadium_id: data.stadium_id,
          start_time: slotStart,
          end_time:   new Date(slotStart.getTime() + 60 * 60 * 1000),
          status:     'booked',
        },
      });
      time_slot_id = newSlot.id;
    }
  }

  const match = await prisma.match.create({
    data: {
      creator_id:   creatorId,
      match_type:   data.match_type as any,
      scheduled_at: new Date(data.scheduled_at),
      max_players:  data.max_players ?? 14,
      stadium_id:   data.stadium_id,
      time_slot_id,
      home_team_id: data.home_team_id,
      away_team_id: data.away_team_id,
    },
    include: {
      creator: { select: { id: true, username: true, avatar_url: true } },
      stadium: { select: { id: true, name: true, address: true } },
    },
  });

  return match;
};

export const getMatches = async (filters: {
  status?: string;
  match_type?: string;
}) => {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.match_type) where.match_type = filters.match_type;

  const matches = await prisma.match.findMany({
    where,
    orderBy: { scheduled_at: 'asc' },
    include: {
      creator: { select: { id: true, username: true, avatar_url: true } },
      stadium: { select: { id: true, name: true, address: true } },
      _count: { select: { participants: true } },
    },
  });

  return matches;
};

export const getMatch = async (matchId: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      creator: { select: { id: true, username: true, avatar_url: true } },
      stadium: { select: { id: true, name: true, address: true } },
      home_team: { select: { id: true, name: true, logo_url: true } },
      away_team: { select: { id: true, name: true, logo_url: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true, avatar_url: true } },
        },
      },
    },
  });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  return match;
};

export const joinMatch = async (userId: string, matchId: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  if (match.status === 'cancelled' || match.status === 'completed') throw new Error('MATCH_UNAVAILABLE');
  if (match.status === 'ready') throw new Error('MATCH_FULL');

  const alreadyJoined = match.participants.some(p => p.user_id === userId);
  if (alreadyJoined) throw new Error('ALREADY_JOINED');

  // Get player profile for position-aware assignment
  const profile = await prisma.playerProfile.findUnique({ where: { user_id: userId } });
  if (!profile) throw new Error('NO_PROFILE');

  // ── Team side: assign to whichever side has fewer players (home wins tie) ──
  const homePlayers = match.participants.filter(p => p.team_side === 'home').length;
  const awayPlayers = match.participants.filter(p => p.team_side === 'away').length;
  const teamSide: 'home' | 'away' = homePlayers <= awayPlayers ? 'home' : 'away';

  // ── Position: slot-aware priority (primary → alternative → primary overflow) ─
  const SLOT_LIMITS: Record<string, number> = { GK: 1, DEF: 2, MID: 2, ATT: 2 };
  const posCounts: Record<string, number>   = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  for (const p of match.participants) {
    if (p.team_side === teamSide && posCounts[p.position_played] !== undefined) {
      posCounts[p.position_played]++;
    }
  }

  let assignedPosition: string = profile.position;
  const primaryFull = posCounts[profile.position] >= (SLOT_LIMITS[profile.position] ?? 99);
  if (primaryFull && profile.alternative_position) {
    const altFull = posCounts[profile.alternative_position] >=
      (SLOT_LIMITS[profile.alternative_position] ?? 99);
    if (!altFull) assignedPosition = profile.alternative_position;
  }

  await prisma.matchParticipant.create({
    data: {
      match_id:        matchId,
      user_id:         userId,
      team_side:       teamSide as any,
      position_played: assignedPosition as any,
    },
  });

  // Update match status
  const newCount = match.participants.length + 1;
  let newStatus: MatchStatus = 'filling';
  if (newCount >= match.max_players) newStatus = 'ready';

  await prisma.match.update({
    where: { id: matchId },
    data: { status: newStatus },
  });

  return { message: `Joined match on ${teamSide} side as ${assignedPosition}.` };
};

export const leaveMatch = async (userId: string, matchId: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  if (match.status === 'completed' || match.status === 'cancelled') throw new Error('MATCH_UNAVAILABLE');

  const participant = match.participants.find(p => p.user_id === userId);
  if (!participant) throw new Error('NOT_IN_MATCH');

  await prisma.matchParticipant.delete({ where: { id: participant.id } });

  // Recalculate status
  const newCount = match.participants.length - 1;
  let newStatus: MatchStatus = newCount === 0 ? 'pending' : 'filling';

  await prisma.match.update({
    where: { id: matchId },
    data: { status: newStatus },
  });

  return { message: 'Left the match.' };
};

export const submitResult = async (
  userId: string,
  matchId: string,
  data: { home_score: number; away_score: number }
) => {
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  if (match.creator_id !== userId) throw new Error('FORBIDDEN');
  if (match.status !== 'ready' && match.status !== 'filling') throw new Error('MATCH_NOT_READY');

  await prisma.match.update({
    where: { id: matchId },
    data: {
      home_score: data.home_score,
      away_score: data.away_score,
      status: 'completed',
    },
  });

  // Update player and team stats
  await updateMatchStats(matchId);

  return { message: 'Result submitted.' };
};

export const cancelMatch = async (userId: string, matchId: string) => {
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  if (match.creator_id !== userId) throw new Error('FORBIDDEN');
  if (match.status === 'completed' || match.status === 'cancelled') throw new Error('MATCH_UNAVAILABLE');

  await prisma.match.update({
    where: { id: matchId },
    data: { status: 'cancelled' },
  });

  // Free the time slot so the stadium manager sees it as available again
  if (match.time_slot_id) {
    await prisma.timeSlot.update({
      where: { id: match.time_slot_id },
      data: { status: 'available' },
    });
  }

  return { message: 'Match cancelled.' };
};

export const invitePlayer = async (creatorId: string, matchId: string, username: string) => {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      participants: true,
      creator: { select: { username: true } },
    },
  });

  if (!match) throw new Error('MATCH_NOT_FOUND');
  if (match.creator_id !== creatorId) throw new Error('FORBIDDEN');
  if (match.status === 'cancelled' || match.status === 'completed') throw new Error('MATCH_UNAVAILABLE');

  const invitee = await prisma.user.findUnique({ where: { username } });
  if (!invitee) throw new Error('USER_NOT_FOUND');
  if (invitee.id === creatorId) throw new Error('CANNOT_INVITE_SELF');

  const alreadyIn = match.participants.some(p => p.user_id === invitee.id);
  if (alreadyIn) throw new Error('ALREADY_IN_MATCH');

  // Prevent duplicate pending invites
  const existing = await prisma.notification.findFirst({
    where: { user_id: invitee.id, type: 'match_invite', related_entity_id: matchId, is_read: false },
  });
  if (existing) throw new Error('ALREADY_INVITED');

  const d = new Date(match.scheduled_at);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  await prisma.notification.create({
    data: {
      user_id:           invitee.id,
      type:              'match_invite',
      title:             'Match Invitation',
      body:              `${match.creator.username} invited you to a match on ${dateStr} at ${timeStr}.`,
      related_entity_id: matchId,
    },
  });

  return { message: `Invitation sent to ${username}.` };
};
