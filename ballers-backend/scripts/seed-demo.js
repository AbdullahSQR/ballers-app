/**
 * Ballers Demo Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates realistic demo data so that sqr@gmail.com (username: Faisal) can
 * demonstrate all core features for thesis screenshots:
 *
 *   1. Matchmaking     → tap Play → gets placed in a filling match
 *   2. Match roster    → filling match already has 4 players with positions shown
 *   3. Post-game rating→ a completed match where Faisal is a participant
 *   4. Team roster     → Faisal is captain of "Ballers FC" with 3 members
 *   5. Notifications   → team challenge + match_filled + system
 *
 * Run: node scripts/seed-demo.js
 * Safe to re-run — all creates are guarded by existence checks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg }     = require('@prisma/adapter-pg');
const bcrypt           = require('bcryptjs');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

// ─── Target user constants (from DB check) ───────────────────────────────────
const TARGET_EMAIL = 'sqr@gmail.com';

// ─── Stadium to use (Al Arouba Sports Complex — first approved) ───────────────
const STADIUM_ID   = 'f89e2b44-6670-4bd0-aa4a-c16dce5cced6'; // Al Arouba St, Madinat Al-Irfan
const STADIUM_LAT  = 23.588;
const STADIUM_LON  = 58.3829;

// ─── Oman time helpers (UTC+4) ────────────────────────────────────────────────
function omanDate(daysFromNow, hour) {
  // Returns a UTC Date that equals hour:00 Oman time (UTC+4) on the target day
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour - 4, 0, 0, 0); // subtract 4 to go from Oman → UTC
  return d;
}

// ─── Demo player definitions ──────────────────────────────────────────────────
const DEMO_PLAYERS = [
  // key, email, position, altPos, ovr, skill, playstyle, matchesPlayed, wins
  ['khalid_gk',   'khalid.gk@demo.com',   'GK',  'DEF', 74, 'intermediate', 'Shot Stopper',          18, 9],
  ['omar_def',    'omar.def@demo.com',     'DEF', 'MID', 68, 'beginner',     'Destroyer',             10, 5],
  ['yasser_def',  'yasser.def@demo.com',   'DEF', 'MID', 77, 'intermediate', 'Ball-Playing Defender', 22, 12],
  ['hassan_mid',  'hassan.mid@demo.com',   'MID', 'ATT', 82, 'advanced',     'Box-to-Box',            35, 20],
  ['faisal_mid2', 'faisal2.mid@demo.com',  'MID', 'ATT', 72, 'intermediate', 'Playmaker',             15, 7],
  ['nasser_att',  'nasser.att@demo.com',   'ATT', 'MID', 85, 'advanced',     'Poacher',               40, 24],
  ['salim_att',   'salim.att@demo.com',    'ATT', 'MID', 66, 'beginner',     'Target Man',             8, 3],
  ['bilal_mid3',  'bilal.mid3@demo.com',   'MID', 'DEF', 88, 'advanced',     'Deep Lying Playmaker',  50, 30],
];

async function main() {
  console.log('\n🌱  Ballers Demo Seed\n');

  // ── 1. Load target user ────────────────────────────────────────────────────
  const targetUser = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: { player_profile: true },
  });
  if (!targetUser)               throw new Error(`User ${TARGET_EMAIL} not found — register first.`);
  if (!targetUser.player_profile) throw new Error(`${TARGET_EMAIL} has no player profile — complete onboarding first.`);
  console.log(`✓  Target user: ${targetUser.username}  |  OVR ${targetUser.player_profile.ovr}  |  ${targetUser.player_profile.position}`);

  // ── 2. Create demo players ─────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo@1234', 12);
  const players = {};   // keyed by DEMO_PLAYERS[i][0]

  for (const [key, email, pos, altPos, ovr, skill, playstyle, played, wins] of DEMO_PLAYERS) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      console.log(`   → ${key} already exists`);
    } else {
      // Scatter location slightly around the stadium
      const latJitter = (Math.random() - 0.5) * 0.08;
      const lonJitter = (Math.random() - 0.5) * 0.08;
      user = await prisma.user.create({
        data: {
          email,
          username: key,
          password_hash: passwordHash,
          role:          'player',
          email_verified: true,
          player_profile: {
            create: {
              position:             pos,
              alternative_position: altPos,
              skill_level:          skill,
              playstyle,
              ovr,
              availability: { frequency: 'weekly', game_type: 'competitive', days: 'weekends', time: 'evening' },
              goals:            'improve',
              latitude:         STADIUM_LAT + latJitter,
              longitude:        STADIUM_LON + lonJitter,
              matches_played:   played,
              wins,
              draws:            Math.floor(played * 0.1),
              losses:           played - wins - Math.floor(played * 0.1),
            },
          },
        },
      });
      console.log(`   ✓  Created ${key}  (OVR ${ovr})`);
    }
    players[key] = user;
  }

  // ── 3. Filling match (tomorrow 18:00 Oman) ────────────────────────────────
  // Faisal (MID, home side) should NOT be in this match yet — he joins via matchmaking
  // Participants: Home: khalid_gk (GK) + omar_def (DEF)
  //               Away: yasser_def (DEF) + faisal_mid2 (MID)
  // Slots left: home needs MID×2, ATT×2; away needs GK×1, MID×1, ATT×2
  // → when Faisal matchmakes, home=2, away=2 → tie → goes home → MID slot open → assigned MID

  let fillingMatch = await prisma.match.findFirst({
    where: { creator_id: players['khalid_gk'].id, status: 'filling' },
    include: { participants: true },
  });

  if (!fillingMatch) {
    const scheduledAt = omanDate(1, 18); // tomorrow 18:00 Oman

    // Create time slot
    const slot = await prisma.timeSlot.create({
      data: {
        stadium_id: STADIUM_ID,
        start_time: scheduledAt,
        end_time:   new Date(scheduledAt.getTime() + 90 * 60 * 1000),
        status:     'booked',
      },
    });

    fillingMatch = await prisma.match.create({
      data: {
        creator_id:  players['khalid_gk'].id,
        stadium_id:  STADIUM_ID,
        time_slot_id: slot.id,
        match_type:  'open',
        status:      'filling',
        scheduled_at: scheduledAt,
        max_players: 14,
      },
    });

    const fillingLineup = [
      { key: 'khalid_gk',   side: 'home', pos: 'GK'  },
      { key: 'omar_def',    side: 'home', pos: 'DEF' },
      { key: 'yasser_def',  side: 'away', pos: 'DEF' },
      { key: 'faisal_mid2', side: 'away', pos: 'MID' },
    ];
    for (const p of fillingLineup) {
      await prisma.matchParticipant.create({
        data: {
          match_id:        fillingMatch.id,
          user_id:         players[p.key].id,
          team_side:       p.side,
          position_played: p.pos,
        },
      });
    }
    console.log(`\n✓  Filling match created  (ID: ${fillingMatch.id})`);
    console.log(`   Scheduled: tomorrow 18:00 Oman  |  Venue: Al Arouba Sports Complex`);
    console.log(`   Participants: khalid_gk (GK/home)  omar_def (DEF/home)  yasser_def (DEF/away)  faisal_mid2 (MID/away)`);
  } else {
    console.log(`\n→  Filling match already exists  (ID: ${fillingMatch.id})`);
  }

  // ── 4. Completed match (last week) ────────────────────────────────────────
  // Faisal is in this match so he can access the rating screen
  let completedMatch = await prisma.match.findFirst({
    where: {
      status: 'completed',
      participants: { some: { user_id: targetUser.id } },
    },
  });

  if (!completedMatch) {
    const playedAt = omanDate(-7, 18); // last week 18:00 Oman

    completedMatch = await prisma.match.create({
      data: {
        creator_id:   targetUser.id,
        stadium_id:   STADIUM_ID,
        match_type:   'open',
        status:       'completed',
        scheduled_at: playedAt,
        max_players:  14,
        home_score:   3,
        away_score:   2,
      },
    });

    // Faisal + 3 home mates vs 3 away opponents
    const completedLineup = [
      { userId: targetUser.id,           side: 'home', pos: targetUser.player_profile.position },
      { key: 'khalid_gk',  side: 'home', pos: 'GK'  },
      { key: 'nasser_att', side: 'home', pos: 'ATT' },
      { key: 'salim_att',  side: 'home', pos: 'ATT' },
      { key: 'hassan_mid', side: 'away', pos: 'MID' },
      { key: 'bilal_mid3', side: 'away', pos: 'MID' },
      { key: 'omar_def',   side: 'away', pos: 'DEF' },
    ];

    for (const p of completedLineup) {
      const uid = p.userId ?? players[p.key].id;
      await prisma.matchParticipant.create({
        data: {
          match_id:        completedMatch.id,
          user_id:         uid,
          team_side:       p.side,
          position_played: p.pos,
        },
      });
    }

    // Update Faisal's match stats to reflect the win
    await prisma.playerProfile.update({
      where: { user_id: targetUser.id },
      data: {
        matches_played: { increment: 1 },
        wins:           { increment: 1 },
      },
    });

    console.log(`\n✓  Completed match created  (ID: ${completedMatch.id})`);
    console.log(`   Result: Home 3 – 2 Away  |  Faisal on home team (${targetUser.player_profile.position})`);
    console.log(`   Home: Faisal, khalid_gk, nasser_att, salim_att`);
    console.log(`   Away: hassan_mid, bilal_mid3, omar_def`);
    console.log(`   → Faisal can now rate his 3 home teammates from this match`);
  } else {
    console.log(`\n→  Completed match already exists  (ID: ${completedMatch.id})`);
  }

  // ── 5. Team: Ballers FC (Faisal is captain) ────────────────────────────────
  let team = await prisma.team.findFirst({
    where: { captain_id: targetUser.id },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name:       'Ballers FC',
        captain_id:  targetUser.id,
        ovr:         76,
        wins:         5,
        draws:        2,
        losses:       1,
        members: {
          create: [
            { user_id: targetUser.id        },  // Faisal — captain
            { user_id: players['hassan_mid'].id },
            { user_id: players['nasser_att'].id },
            { user_id: players['khalid_gk'].id  },
          ],
        },
      },
    });
    console.log(`\n✓  Team "Ballers FC" created  (ID: ${team.id})`);
    console.log(`   Captain: Faisal  |  Members: hassan_mid, nasser_att, khalid_gk`);
  } else {
    console.log(`\n→  Team already exists: "${team.name}"  (ID: ${team.id})`);
  }

  // ── 6. Challenger team + pending challenge ─────────────────────────────────
  let challengerTeam = await prisma.team.findFirst({
    where: { name: 'Al Noor United' },
  });

  if (!challengerTeam) {
    challengerTeam = await prisma.team.create({
      data: {
        name:       'Al Noor United',
        captain_id:  players['bilal_mid3'].id,
        ovr:         81,
        wins:         6,
        draws:        1,
        losses:       2,
        members: {
          create: [
            { user_id: players['bilal_mid3'].id  },
            { user_id: players['yasser_def'].id  },
            { user_id: players['faisal_mid2'].id },
            { user_id: players['salim_att'].id   },
          ],
        },
      },
    });
    console.log(`\n✓  Challenger team "Al Noor United" created  (ID: ${challengerTeam.id})`);
  }

  if (team) {
    const existingChallenge = await prisma.invitation.findFirst({
      where: {
        type:         'team_challenge',
        sender_id:    players['bilal_mid3'].id,
        recipient_id: targetUser.id,
        status:       'pending',
      },
    });

    if (!existingChallenge) {
      const challenge = await prisma.invitation.create({
        data: {
          type:         'team_challenge',
          sender_id:    players['bilal_mid3'].id,
          recipient_id: targetUser.id,
          team_id:      challengerTeam.id,
          status:       'pending',
        },
      });
      console.log(`✓  Challenge from "Al Noor United" → Faisal  (ID: ${challenge.id})`);

      // Challenge notification
      await prisma.notification.create({
        data: {
          user_id:           targetUser.id,
          type:              'challenge',
          title:             'New Team Challenge!',
          body:              'Al Noor United has challenged Ballers FC to a match. Accept or decline in the Teams tab.',
          related_entity_id: challenge.id,
          is_read:           false,
        },
      });
    } else {
      console.log(`→  Challenge already exists`);
    }
  }

  // ── 7. Notifications ───────────────────────────────────────────────────────
  const systemNotifExists = await prisma.notification.findFirst({
    where: { user_id: targetUser.id, type: 'system' },
  });
  if (!systemNotifExists) {
    await prisma.notification.create({
      data: {
        user_id: targetUser.id,
        type:    'system',
        title:   'Welcome to Ballers!',
        body:    'Your account is set up and ready. Tap Play to find your first match.',
        is_read: false,
      },
    });
    console.log(`✓  System notification created`);
  }

  const filledNotifExists = await prisma.notification.findFirst({
    where: { user_id: targetUser.id, type: 'match_filled' },
  });
  if (!filledNotifExists) {
    await prisma.notification.create({
      data: {
        user_id:           targetUser.id,
        type:              'match_filled',
        title:             'Match Confirmed!',
        body:              'All spots are filled. Your match is set for this Friday at 6:00 PM at Al Arouba Sports Complex.',
        related_entity_id: fillingMatch.id,
        is_read:           false,
      },
    });
    console.log(`✓  Match-filled notification created`);
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(64));
  console.log('✅  Demo seed complete!\n');
  console.log('📸  Screenshot flow:');
  console.log('   1. Log in as sqr@gmail.com');
  console.log('   2. Home screen → bell icon → 3 unread notifications');
  console.log('   3. Home screen → tap Play → matchmaking places Faisal');
  console.log('      in the filling match (OVR 70, closest to avg OVR ~72)');
  console.log('   4. Match screen → see Home/Away roster with positions');
  console.log('   5. Past matches → open the completed match → tap Rate');
  console.log('      → rate khalid_gk, nasser_att, salim_att (home teammates)');
  console.log('   6. Teams tab → Ballers FC → 4-member roster');
  console.log('   7. Teams tab → Challenges → pending challenge from Al Noor United');
  console.log('─'.repeat(64) + '\n');
}

main()
  .catch(e => { console.error('\n❌  Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
