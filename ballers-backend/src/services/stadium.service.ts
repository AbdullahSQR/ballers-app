import prisma from '../config/database';

// Playing hours in Oman local time (UTC+4)
const PLAYING_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];
const OMAN_OFFSET_MS = 4 * 60 * 60 * 1000;

/**
 * Returns available (not blocked, not booked, not past) 1-hour slots
 * for a given stadium on a given Oman local date string ('YYYY-MM-DD').
 */
export const getAvailableSlots = async (stadiumId: string, dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Oman midnight for that date as a real UTC timestamp
  // midnight Oman = UTC midnight of that date - 4h
  const omanMidnight = new Date(Date.UTC(year, month - 1, day, -4, 0, 0, 0));
  const omanEndOfDay = new Date(omanMidnight.getTime() + 24 * 60 * 60 * 1000);

  // Fetch all DB slot records for this stadium on this day
  const dbSlots = await prisma.timeSlot.findMany({
    where: {
      stadium_id: stadiumId,
      start_time: { gte: omanMidnight, lt: omanEndOfDay },
    },
  });

  // Build map: "YYYY-MM-DDTHH" (UTC) → slot record
  const blockedKeys = new Set(
    dbSlots
      .filter(s => s.status === 'blocked' || s.status === 'booked')
      .map(s => new Date(s.start_time).toISOString().slice(0, 13)),
  );

  const now = Date.now();
  const available: Array<{ hour: number; start_time: string; end_time: string }> = [];

  for (const hour of PLAYING_HOURS) {
    const start = new Date(omanMidnight.getTime() + hour * 60 * 60 * 1000);
    if (start.getTime() <= now) continue; // skip past slots
    const key = start.toISOString().slice(0, 13);
    if (blockedKeys.has(key)) continue; // skip blocked/booked
    available.push({
      hour,
      start_time: start.toISOString(),
      end_time:   new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
    });
  }

  return available;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const getStadiums = async (userId?: string) => {
  const stadiums = await prisma.stadium.findMany({
    where: { is_approved: true },
    include: {
      manager: { select: { id: true, username: true } },
      _count: { select: { time_slots: true } },
    },
  });

  // Load player location if userId provided
  let playerLat: number | null = null;
  let playerLon: number | null = null;

  if (userId) {
    const profile = await prisma.playerProfile.findUnique({
      where: { user_id: userId },
      select: { latitude: true, longitude: true },
    });
    if (profile?.latitude !== null && profile?.longitude !== null) {
      playerLat = profile?.latitude ?? null;
      playerLon = profile?.longitude ?? null;
    }
  }

  // Attach distance and sort
  const withDistance = stadiums.map(s => {
    let distance_km: number | null = null;
    if (playerLat !== null && playerLon !== null && s.latitude !== null && s.longitude !== null) {
      distance_km = Math.round(
        haversineKm(playerLat, playerLon, Number(s.latitude), Number(s.longitude)) * 10
      ) / 10;
    }
    return { ...s, distance_km };
  });

  // Sort: if location available → by distance asc; else → alphabetical
  if (playerLat !== null) {
    withDistance.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
  } else {
    withDistance.sort((a, b) => a.name.localeCompare(b.name));
  }

  return withDistance;
};

export const getStadium = async (stadiumId: string) => {
  const stadium = await prisma.stadium.findUnique({
    where: { id: stadiumId },
    include: {
      manager: { select: { id: true, username: true } },
      time_slots: {
        orderBy: { start_time: 'asc' },
      },
    },
  });

  if (!stadium) throw new Error('STADIUM_NOT_FOUND');
  return stadium;
};

export const applyToManage = async (
  userId: string,
  data: {
    stadium_name: string;
    proposed_address: string;
    phone_number?: string;
    stadium_type?: string;
    notes?: string;
  }
) => {
  const existingApplication = await prisma.stadiumManagerApplication.findFirst({
    where: { user_id: userId, status: 'pending' },
  });

  if (existingApplication) throw new Error('APPLICATION_PENDING');

  const application = await prisma.stadiumManagerApplication.create({
    data: {
      user_id: userId,
      stadium_name: data.stadium_name,
      proposed_address: data.proposed_address,
      phone_number: data.phone_number,
      stadium_type: data.stadium_type,
      notes: data.notes,
    },
  });

  return application;
};

export const getMyStadium = async (managerId: string) => {
  // Use Oman midnight (UTC+4) as the lower bound so the filter is
  // correct regardless of the server's local timezone.
  const OMAN_OFFSET_MS = 4 * 60 * 60 * 1000;
  const nowOman = new Date(Date.now() + OMAN_OFFSET_MS);
  // midnight Oman = that date at 00:00 Oman = 20:00 UTC previous day
  const startOfTodayOman = new Date(
    Date.UTC(nowOman.getUTCFullYear(), nowOman.getUTCMonth(), nowOman.getUTCDate(), -4, 0, 0, 0),
  );
  const twoWeeksLater = new Date(startOfTodayOman.getTime() + 14 * 24 * 60 * 60 * 1000);

  const stadium = await prisma.stadium.findFirst({
    where: { manager_id: managerId },
    include: {
      time_slots: {
        where: { start_time: { gte: startOfTodayOman, lte: twoWeeksLater } },
        orderBy: { start_time: 'asc' },
      },
      _count: { select: { matches: true } },
    },
  });
  return stadium ?? null;
};

export const addTimeSlot = async (
  managerId: string,
  stadiumId: string,
  data: { start_time: string; end_time: string; status?: string }
) => {
  const stadium = await prisma.stadium.findUnique({ where: { id: stadiumId } });

  if (!stadium) throw new Error('STADIUM_NOT_FOUND');
  if (stadium.manager_id !== managerId) throw new Error('FORBIDDEN');

  const slot = await prisma.timeSlot.create({
    data: {
      stadium_id: stadiumId,
      start_time: new Date(data.start_time),
      end_time: new Date(data.end_time),
      status: (data.status as any) ?? 'blocked',
    },
  });

  return slot;
};

export const updateTimeSlot = async (
  managerId: string,
  stadiumId: string,
  slotId: string,
  data: { start_time?: string; end_time?: string; status?: string }
) => {
  const stadium = await prisma.stadium.findUnique({ where: { id: stadiumId } });

  if (!stadium) throw new Error('STADIUM_NOT_FOUND');
  if (stadium.manager_id !== managerId) throw new Error('FORBIDDEN');

  const slot = await prisma.timeSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.stadium_id !== stadiumId) throw new Error('SLOT_NOT_FOUND');

  return prisma.timeSlot.update({
    where: { id: slotId },
    data: {
      ...(data.start_time && { start_time: new Date(data.start_time) }),
      ...(data.end_time && { end_time: new Date(data.end_time) }),
      ...(data.status && { status: data.status as any }),
    },
  });
};

export const deleteTimeSlot = async (
  managerId: string,
  stadiumId: string,
  slotId: string
) => {
  const stadium = await prisma.stadium.findUnique({ where: { id: stadiumId } });

  if (!stadium) throw new Error('STADIUM_NOT_FOUND');
  if (stadium.manager_id !== managerId) throw new Error('FORBIDDEN');

  const slot = await prisma.timeSlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.stadium_id !== stadiumId) throw new Error('SLOT_NOT_FOUND');

  await prisma.timeSlot.delete({ where: { id: slotId } });

  return { message: 'Time slot removed.' };
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getApplications = async () => {
  return prisma.stadiumManagerApplication.findMany({
    where: { status: 'pending' },
    include: {
      applicant: { select: { id: true, username: true, email: true } },
    },
    orderBy: { created_at: 'asc' },
  });
};

export const reviewApplication = async (
  adminId: string,
  applicationId: string,
  decision: 'approved' | 'rejected'
) => {
  const application = await prisma.stadiumManagerApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) throw new Error('APPLICATION_NOT_FOUND');
  if (application.status !== 'pending') throw new Error('ALREADY_REVIEWED');

  await prisma.stadiumManagerApplication.update({
    where: { id: applicationId },
    data: {
      status: decision,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    },
  });

  // If approved, promote user to stadium_manager role
  if (decision === 'approved') {
    await prisma.user.update({
      where: { id: application.user_id },
      data: { role: 'stadium_manager' },
    });
  }

  return { message: `Application ${decision}.` };
};

export const createStadium = async (data: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  photo_url?: string;
  manager_id?: string;
}) => {
  const stadium = await prisma.stadium.create({
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      photo_url: data.photo_url,
      manager_id: data.manager_id,
      is_approved: true,
    },
  });

  // If a manager is assigned, update their role
  if (data.manager_id) {
    await prisma.user.update({
      where: { id: data.manager_id },
      data: { role: 'stadium_manager' },
    });
  }

  return stadium;
};
