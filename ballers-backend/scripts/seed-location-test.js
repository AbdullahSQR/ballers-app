/**
 * Location test seed — creates one filling match at each stadium so the
 * matchmaking algorithm has real choices to score.
 *
 * Run:  node scripts/seed-location-test.js
 * Clean: node scripts/seed-location-test.js --clean
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const STADIUMS = [
  { id: 'f89e2b44-6670-4bd0-aa4a-c16dce5cced6', name: 'Al Arouba Sports Complex' },
  { id: '5076a722-5588-4b85-b8ac-89d267e677a0', name: 'Qurum FC Arena'           },
  { id: '7d807557-a64d-44a5-aa2e-8b15dfaac39a', name: 'Bowsher Football Park'    },
];

// A real player to act as the creator of each test match
const CREATOR_EMAIL = 'khalid.gk@demo.com';

// Tomorrow 19:00 Oman (UTC+4 = 15:00 UTC)
function tomorrowAt19() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(15, 0, 0, 0);
  return d;
}

async function clean() {
  const deleted = await prisma.match.deleteMany({
    where: { status: 'filling', creator: { email: CREATOR_EMAIL } },
  });
  console.log(`Deleted ${deleted.count} test matches.`);
}

async function seed() {
  const creator = await prisma.user.findUnique({ where: { email: CREATOR_EMAIL } });
  if (!creator) throw new Error(`Creator ${CREATOR_EMAIL} not found — run seed-demo.js first`);

  console.log(`\n🌱  Creating one filling match per stadium\n`);
  const scheduledAt = tomorrowAt19();

  for (const stadium of STADIUMS) {
    // Skip if a test match already exists at this stadium
    const existing = await prisma.match.findFirst({
      where: { stadium_id: stadium.id, status: 'filling', creator_id: creator.id },
    });
    if (existing) {
      console.log(`   → ${stadium.name}: match already exists (${existing.id})`);
      continue;
    }

    const slot = await prisma.timeSlot.create({
      data: {
        stadium_id: stadium.id,
        start_time: scheduledAt,
        end_time:   new Date(scheduledAt.getTime() + 90 * 60 * 1000),
        status:     'booked',
      },
    });

    const match = await prisma.match.create({
      data: {
        creator_id:   creator.id,
        stadium_id:   stadium.id,
        time_slot_id: slot.id,
        match_type:   'open',
        status:       'filling',
        scheduled_at: scheduledAt,
        max_players:  14,
      },
    });

    // Add 3 players so it's not empty (matchmaking needs status=filling)
    // Use the creator as a participant with a generic position
    await prisma.matchParticipant.create({
      data: {
        match_id:        match.id,
        user_id:         creator.id,
        team_side:       'home',
        position_played: 'GK',
      },
    });

    console.log(`   ✓  ${stadium.name}: match ${match.id}`);
  }

  console.log('\n✅  Done — 3 filling matches now exist, one per stadium.');
  console.log('    Log in with the player account and tap Play.');
  console.log('    The algorithm will pick the match closest to their stored location.\n');
}

const isClean = process.argv.includes('--clean');
(isClean ? clean() : seed())
  .catch(e => { console.error('Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
