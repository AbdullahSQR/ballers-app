/**
 * Seeds 3 stadium managers + 3 approved stadiums for testing.
 * Safe to run multiple times (upserts).
 * Run: node scripts/seed-stadiums.mjs
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

const MANAGERS = [
  {
    email:    'manager1@ballers.test',
    username: 'mgr_arouba',
    password: 'Manager1!',
    stadium: {
      name:        'Al Arouba Sports Complex',
      address:     'Al Arouba St, Madinat Al-Irfan, Muscat',
      latitude:    23.5880,
      longitude:   58.3829,
      description: 'Premium 7v7 floodlit pitches with changing rooms and spectator stands.',
    },
  },
  {
    email:    'manager2@ballers.test',
    username: 'mgr_qurum',
    password: 'Manager2!',
    stadium: {
      name:        'Qurum FC Arena',
      address:     'Qurum Beach Rd, Qurum, Muscat',
      latitude:    23.5966,
      longitude:   58.3951,
      description: 'Seafront football arena with synthetic turf and full facilities.',
    },
  },
  {
    email:    'manager3@ballers.test',
    username: 'mgr_bowsher',
    password: 'Manager3!',
    stadium: {
      name:        'Bowsher Football Park',
      address:     'Way 3018, Bowsher, Muscat',
      latitude:    23.6101,
      longitude:   58.5512,
      description: 'Community park with two 7v7 pitches, parking and café.',
    },
  },
];

async function main() {
  for (const m of MANAGERS) {
    const hash = await bcrypt.hash(m.password, 10);

    // 1 — Upsert manager user
    const user = await prisma.user.upsert({
      where:  { email: m.email },
      update: { role: 'stadium_manager', email_verified: true, password_hash: hash },
      create: {
        email:          m.email,
        username:       m.username,
        password_hash:  hash,
        role:           'stadium_manager',
        email_verified: true,
      },
    });
    console.log(`✅  Manager: ${user.email}  (id: ${user.id})`);

    // 2 — Upsert stadium
    const existing = await prisma.stadium.findFirst({ where: { manager_id: user.id } });

    let stadium;
    if (existing) {
      stadium = await prisma.stadium.update({
        where: { id: existing.id },
        data: {
          name:        m.stadium.name,
          address:     m.stadium.address,
          latitude:    m.stadium.latitude,
          longitude:   m.stadium.longitude,
          description: m.stadium.description,
          is_approved: true,
        },
      });
      console.log(`  ↻  Stadium updated: ${stadium.name} (id: ${stadium.id})`);
    } else {
      stadium = await prisma.stadium.create({
        data: {
          name:        m.stadium.name,
          address:     m.stadium.address,
          latitude:    m.stadium.latitude,
          longitude:   m.stadium.longitude,
          description: m.stadium.description,
          is_approved: true,
          manager_id:  user.id,
        },
      });
      console.log(`  ✅  Stadium created: ${stadium.name} (id: ${stadium.id})`);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('  Test credentials');
  console.log('─────────────────────────────────────────');
  for (const m of MANAGERS) {
    console.log(`  ${m.stadium.name}`);
    console.log(`    Email   : ${m.email}`);
    console.log(`    Password: ${m.password}`);
    console.log('');
  }
  console.log('─────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
