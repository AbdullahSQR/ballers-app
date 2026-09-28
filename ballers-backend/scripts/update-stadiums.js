/**
 * Updates the three existing stadiums with real Muscat locations:
 *   f89e2b44  →  Seeb Sports Complex   (northwest, near airport)
 *   5076a722  →  Qurum FC Arena        (central-west, Qurum Beach area)
 *   7d807557  →  Bowsher Sports Club   (central, between Qurum and Ruwi)
 *
 * Run:  node scripts/update-stadiums.js
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UPDATES = [
  {
    id:        'f89e2b44-6670-4bd0-aa4a-c16dce5cced6',
    name:      'Seeb Sports Complex',
    address:   'Way 5108, Al Seeb, Muscat',
    latitude:  23.6748,
    longitude: 58.1889,
  },
  {
    id:        '5076a722-5588-4b85-b8ac-89d267e677a0',
    name:      'Qurum FC Arena',
    address:   'Qurum Beach Rd, Qurum, Muscat',
    latitude:  23.6072,
    longitude: 58.3974,
  },
  {
    id:        '7d807557-a64d-44a5-aa2e-8b15dfaac39a',
    name:      'Bowsher Sports Club',
    address:   'Way 3018, Bowsher, Muscat',
    latitude:  23.6140,
    longitude: 58.4920,
  },
];

// Haversine for a quick sanity-check print
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2
          + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180)
          * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Approximate centre of Ghubrah South (mid-range estimate)
const USER_LAT = 23.610;
const USER_LON = 58.527;

async function main() {
  console.log('\n🏟️  Updating stadiums to real Muscat locations\n');

  for (const s of UPDATES) {
    await pool.query(
      `UPDATE "Stadium"
          SET name      = $1,
              address   = $2,
              latitude  = $3,
              longitude = $4
        WHERE id = $5`,
      [s.name, s.address, s.latitude, s.longitude, s.id]
    );
    const km = haversineKm(USER_LAT, USER_LON, s.latitude, s.longitude);
    console.log(`  ✓  ${s.name.padEnd(25)} lat ${s.latitude}, lon ${s.longitude}  →  ~${km.toFixed(1)} km from Ghubrah South`);
  }

  // Confirm final state
  const rows = await pool.query(
    `SELECT name, address, latitude, longitude,
            (SELECT COUNT(*) FROM "Match" m WHERE m.stadium_id = s.id) AS matches
       FROM "Stadium" s ORDER BY longitude ASC`
  );
  console.log('\nFinal state (west → east):\n');
  rows.rows.forEach(r =>
    console.log(`  ${r.name.padEnd(25)}  lat ${parseFloat(r.latitude).toFixed(4)}, lon ${parseFloat(r.longitude).toFixed(4)}  |  ${r.matches} matches  |  ${r.address}`)
  );

  console.log('\n✅  Done — restart the app and check matchmaking distances.\n');
}

main().catch(console.error).finally(() => pool.end());
