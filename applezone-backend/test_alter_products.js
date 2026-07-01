require('dotenv').config();
const { query } = require('./src/config/db');

async function test() {
  try {
    const result = await query(`
      IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE Name = N'thumbnail_url' AND Object_ID = Object_ID(N'Products')
      )
      BEGIN
          ALTER TABLE Products ADD thumbnail_url VARCHAR(500) NULL;
          PRINT 'Added thumbnail_url column';
      END
      ELSE
      BEGIN
          PRINT 'Column already exists';
      END
    `);
    console.log('SUCCESS');
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit();
}
test();
