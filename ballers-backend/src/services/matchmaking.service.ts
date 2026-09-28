import prisma from '../config/database';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Slots available per position per team side in a 7v7 match */
const SLOT_LIMITS: Record<string, number> = { GK: 1, DEF: 2, MID: 2, ATT: 2 };

/** Oman Standard Time offset */
const OMAN_OFFSET_MS = 4 * 60 * 60 * 1000;

/** Preferred kick-off hours in Oman local time (6 PM first, expanding outward) */
const PREFERRED_HOURS = [18,19,20,17,16,21,15,14,22,13,12,11,10,9,8,7,6];

/** Normalisation ceiling for OVR difference scoring (30 points = max spread considered) */
const MAX_OVR_DIFF = 30;

/** Normalisation ceiling for distance scoring (50 km = max distance considered) */
const MAX_DISTANCE_KM = 50;

// ─── Haversine distance ───────────────────────────────────────────────────────

function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Position-aware team-side + position assignment ──────────────────────────

function resolveAssignment(
  participants: Array<{ team_side: string; position_played: string }>,
  primaryPos: string,
  altPos: string | null,
): { teamSide: 'home' | 'away'; assignedPosition: string } {
  
  const homePlayers = participants.filter(p => p.team_side === 'home').length;
  const awayPlayers = participants.filter(p => p.team_side === 'away').length;
  const teamSide: 'home' | 'away' = homePlayers <= awayPlayers ? 'home' : 'away';

  const posCounts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, ATT: 0 };
  for (const p of participants) {
    if (p.team_side === teamSide && posCounts[p.position_played] !== undefined) {
      posCounts[p.position_played]++;
    }
  }

  let assignedPosition = primaryPos;
  const primaryFull = posCounts[primaryPos] >= (SLOT_LIMITS[primaryPos] ?? 99);

  if (primaryFull && altPos) {
    const altFull = posCounts[altPos] >= (SLOT_LIMITS[altPos] ?? 99);
    if (!altFull) assignedPosition = altPos;
  }

  return { teamSide, assignedPosition };
}

// ─── Main entry point ────────────────────────────────────────────────────────

export const findMatch = async (userId: string) => {
  // 1 — Load player profile (OVR, position, location)
  const profile = await prisma.playerProfile.findUnique({ where: { user_id: userId } });
  if (!profile) throw new Error('NO_PROFILE');

  // 2 — Block if already in an active open match
  const activeOpenMatch = await prisma.matchParticipant.findFirst({
    where: {
      user_id: userId,
      match: { match_type: 'open', status: { in: ['pending', 'filling', 'ready'] } },
    },
  });
  if (activeOpenMatch) throw new Error('ALREADY_IN_MATCH');

  // 3 — Load all open matches (pending / filling) with participants + stadium coords
  const availableMatches = await prisma.match.findMany({
    where: { match_type: 'open', status: { in: ['pending', 'filling'] } },
    include: {
      participants: {
        include: {
          user: { include: { player_profile: { select: { ovr: true } } } },
        },
      },
      stadium: { select: { id: true, name: true, address: true, latitude: true, longitude: true } },
    },
  });

  // 4 — Filter: not already in, not full
  const eligibleMatches = availableMatches.filter(match => {
    const alreadyIn = match.participants.some(p => p.user_id === userId);
    const isFull    = match.participants.length >= match.max_players;
    return !alreadyIn && !isFull;
  });

  let targetMatchId: string;

  if (eligibleMatches.length > 0) {
    // 5 — Score each match: weighted OVR proximity (60%) + distance (40%)
    const playerLat = profile.latitude;
    const playerLon = profile.longitude;
    const hasLocation = playerLat !== null && playerLon !== null;

    const scored = eligibleMatches.map(match => {
      // OVR component
      const participantOvrs = match.participants
        .map(p => p.user.player_profile?.ovr ?? 70);
      const avgOvr = participantOvrs.length > 0
        ? participantOvrs.reduce((s, o) => s + o, 0) / participantOvrs.length
        : 70;
      const ovrDiff  = Math.abs(profile.ovr - avgOvr);
      const ovrScore = Math.min(ovrDiff / MAX_OVR_DIFF, 1);

      // Distance component
      let distScore = 0;
      if (hasLocation && match.stadium?.latitude && match.stadium?.longitude) {
        const km = haversineKm(
          playerLat!, playerLon!,
          Number(match.stadium.latitude),
          Number(match.stadium.longitude),
        );
        distScore = Math.min(km / MAX_DISTANCE_KM, 1);
      }

      // Combined score (lower = better)
      const combined = hasLocation
        ? 0.6 * ovrScore + 0.4 * distScore
        : ovrScore;

      return { matchId: match.id, combined };
    });

    scored.sort((a, b) => a.combined - b.combined);
    targetMatchId = scored[0].matchId;

  } else {
    // 6 — No eligible matches: create a new one with nearest available stadium slot
    const nowOman = new Date(Date.now() + OMAN_OFFSET_MS);

    const stadiums = await prisma.stadium.findMany({
      where: { is_approved: true },
      select: { id: true, latitude: true, longitude: true },
    });

    // Sort stadiums by distance from player (if location available)
    const playerLat = profile.latitude;
    const playerLon = profile.longitude;
    const sortedStadiums = (playerLat !== null && playerLon !== null)
      ? [...stadiums].sort((a, b) => {
          if (!a.latitude || !b.latitude) return 0;
          const da = haversineKm(playerLat!, playerLon!, Number(a.latitude), Number(a.longitude));
          const db = haversineKm(playerLat!, playerLon!, Number(b.latitude), Number(b.longitude));
          return da - db;
        })
      : stadiums;

    let chosenStadiumId: string | null   = null;
    let chosenScheduledAt: Date | null   = null;
    let chosenSlotId: string | null      = null;

    outer: for (const hour of PREFERRED_HOURS) {
      const candidate = new Date(Date.UTC(
        nowOman.getUTCFullYear(), nowOman.getUTCMonth(), nowOman.getUTCDate() + 1,
        -4 + hour, 0, 0, 0,
      ));

      for (const stadium of sortedStadiums) {
        const conflict = await prisma.timeSlot.findFirst({
          where: {
            stadium_id: stadium.id,
            start_time: candidate,
            status: { in: ['blocked', 'booked'] },
          },
        });
        if (!conflict) {
          chosenStadiumId   = stadium.id;
          chosenScheduledAt = candidate;
          break outer;
        }
      }
    }

    // Fallback: no slot found — create match without a venue
    if (!chosenStadiumId) {
      chosenScheduledAt = new Date(Date.UTC(
        nowOman.getUTCFullYear(), nowOman.getUTCMonth(), nowOman.getUTCDate() + 1,
        -4 + 18, 0, 0, 0,
      ));
    }

    // Book the slot
    if (chosenStadiumId && chosenScheduledAt) {
      const slot = await prisma.timeSlot.create({
        data: {
          stadium_id: chosenStadiumId,
          start_time: chosenScheduledAt,
          end_time:   new Date(chosenScheduledAt.getTime() + 60 * 60 * 1000),
          status:     'booked',
        },
      });
      chosenSlotId = slot.id;
    }

    const newMatch = await prisma.match.create({
      data: {
        creator_id:   userId,
        match_type:   'open',
        scheduled_at: chosenScheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        status:       'pending',
        max_players:  14,
        stadium_id:   chosenStadiumId ?? undefined,
        time_slot_id: chosenSlotId ?? undefined,
      },
    });
    targetMatchId = newMatch.id;
  }

  // 7 — Auto-join with position-aware assignment
  const targetMatch = await prisma.match.findUnique({
    where: { id: targetMatchId },
    include: { participants: true },
  });

  const { teamSide, assignedPosition } = resolveAssignment(
    targetMatch!.participants,
    profile.position,
    profile.alternative_position ?? null,
  );

  await prisma.matchParticipant.create({
    data: {
      match_id:        targetMatchId,
      user_id:         userId,
      team_side:       teamSide as any,
      position_played: assignedPosition as any,
    },
  });

  // 8 — Update match status
  const newCount  = targetMatch!.participants.length + 1;
  const newStatus = newCount >= targetMatch!.max_players ? 'ready' : 'filling';

  await prisma.match.update({
    where: { id: targetMatchId },
    data: { status: newStatus },
  });

  // 9 — Return full match
  const finalMatch = await prisma.match.findUnique({
    where: { id: targetMatchId },
    include: {
      creator:      { select: { id: true, username: true } },
      stadium:      { select: { id: true, name: true, address: true } },
      participants: {
        include: {
          user: { select: { id: true, username: true, avatar_url: true } },
        },
      },
    },
  });

  return {
    message: `You've been placed in a match on the ${teamSide} side as ${assignedPosition}.`,
    match:   finalMatch,
  };
};
