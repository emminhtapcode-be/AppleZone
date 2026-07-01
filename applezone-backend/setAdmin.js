require('dotenv').config();
const { sql, getPool } = require('./src/config/db');

async function setAdmin() {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`UPDATE Users SET ROLE = 'Admin'`);
    console.log(`Updated ${result.rowsAffected} rows to Admin role.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setAdmin();
