/**
 * Migrates all matches and time slots from the test Al Arouba stadium
 * (manager@ballers.test, "Muscat, Oman") to the real one
 * (manager1@ballers.test, "Al Arouba St, Madinat Al-Irfan, Muscat")
 * then deletes the test stadium.
 */
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const OLD_ID = '30ca45ec-08cb-4912-af02-2d6e11d9d3ac'; // test — "Muscat, Oman"
const NEW_ID = 'f89e2b44-6670-4bd0-aa4a-c16dce5cced6'; // real — "Al Arouba St"

async function main() {
  console.log('\n🔄  Migrating test Al Arouba → real Al Arouba\n');

  // 1. Move time slots
  const slots = await pool.query(
    `UPDATE "TimeSlot" SET stadium_id = $1 WHERE stadium_id = $2 RETURNING id`,
    [NEW_ID, OLD_ID]
  );
  console.log(`✓  Moved ${slots.rowCount} time slots`);

  // 2. Move matches
  const matches = await pool.query(
    `UPDATE "Match" SET stadium_id = $1 WHERE stadium_id = $2 RETURNING id`,
    [NEW_ID, OLD_ID]
  );
  console.log(`✓  Moved ${matches.rowCount} matches`);

  // 3. Delete the test stadium (no more FK references)
  await pool.query(`DELETE FROM "Stadium" WHERE id = $1`, [OLD_ID]);
  console.log(`✓  Deleted test stadium (${OLD_ID})`);

  // 4. Confirm remaining stadiums
  const remaining = await pool.query(
    `SELECT name, address, ROUND(latitude::numeric,6) as lat, ROUND(longitude::numeric,6) as lon,
            (SELECT COUNT(*) FROM "Match" m WHERE m.stadium_id = s.id) as matches
     FROM "Stadium" s ORDER BY s.created_at`
  );
  console.log('\nRemaining stadiums:');
  remaining.rows.forEach(r =>
    console.log(`  ${r.name}  |  ${r.address}  |  lat ${r.lat}, lon ${r.lon}  |  ${r.matches} matches`)
  );

  console.log('\n✅  Done\n');
}

main().catch(console.error).finally(() => pool.end());
