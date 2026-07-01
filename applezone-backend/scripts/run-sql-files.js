const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config();

const files = process.argv.slice(2);

if (!files.length) {
  console.error('Usage: node scripts/run-sql-files.js <file.sql> [more.sql]');
  process.exit(1);
}

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'AppleZone',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

function splitBatches(script) {
  return script
    .split(/^\s*GO\s*;?\s*$/gim)
    .map(batch => batch.trim())
    .filter(Boolean);
}

async function runFile(pool, fileName) {
  const filePath = path.resolve(__dirname, '..', 'database', fileName);
  const script = fs.readFileSync(filePath, 'utf8');
  const batches = splitBatches(script);
  let ok = 0;
  let failed = 0;

  console.log(`\n== ${fileName} ==`);
  for (let index = 0; index < batches.length; index += 1) {
    try {
      await pool.request().batch(batches[index]);
      ok += 1;
      console.log(`  batch ${index + 1}/${batches.length}: OK`);
    } catch (error) {
      failed += 1;
      console.log(`  batch ${index + 1}/${batches.length}: ERROR - ${error.message}`);
    }
  }

  return { fileName, ok, failed };
}

async function main() {
  const pool = await sql.connect(dbConfig);
  const results = [];

  try {
    for (const file of files) {
      results.push(await runFile(pool, file));
    }
  } finally {
    await pool.close();
  }

  console.log('\nSummary');
  for (const result of results) {
    console.log(`- ${result.fileName}: ${result.ok} OK, ${result.failed} failed`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
