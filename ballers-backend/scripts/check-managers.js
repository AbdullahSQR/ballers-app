const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(`
  SELECT email, username, role, email_verified
  FROM "User"
  WHERE email LIKE 'manager%@ballers.test'
  ORDER BY email
`)
.then(r => {
  console.log('\nManager accounts:\n');
  r.rows.forEach(row => console.log(JSON.stringify(row)));
})
.finally(() => pool.end());
