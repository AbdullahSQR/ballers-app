/**
 * Creates a test stadium manager account + an approved stadium assigned to them.
 * Run once: node scripts/seed-stadium-manager.mjs
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
const prisma = new PrismaClient({ adapter });

const EMAIL    = 'manager@ballers.test';
const PASSWORD = 'Manager123!';
const USERNAME = 'stadium_mgr';

async function main() {
  // 1 — Create or update the user
  const hash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { role: 'stadium_manager', email_verified: true, password_hash: hash },
    create: {
      email: EMAIL,
      username: USERNAME,
      password_hash: hash,
      role: 'stadium_manager',
      email_verified: true,
    },
  });

  console.log(`✅  User: ${user.email}  (id: ${user.id})`);

  // 2 — Create the stadium if none is assigned yet
  const existing = await prisma.stadium.findFirst({ where: { manager_id: user.id } });

  if (existing) {
    console.log(`ℹ️   Stadium already exists: ${existing.name} (id: ${existing.id})`);
  } else {
    const stadium = await prisma.stadium.create({
      data: {
        name: 'Al Arouba Sports Complex',
        address: 'Muscat, Oman',
        latitude: 23.5880,
        longitude: 58.3829,
        description: 'Premium 7v7 football pitches with floodlights.',
        is_approved: true,
        manager_id: user.id,
      },
    });
    console.log(`✅  Stadium: ${stadium.name} (id: ${stadium.id})`);
  }

  console.log('\n─────────────────────────────────');
  console.log('  Login credentials');
  console.log('─────────────────────────────────');
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Password : ${PASSWORD}`);
  console.log('─────────────────────────────────\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
