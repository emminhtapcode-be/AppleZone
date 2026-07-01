require('dotenv').config();
const { query, sql } = require('./src/config/db');

async function test() {
  try {
    const variantId = 1;
    const stock_quantity = 99;
    const queryStr = `
      UPDATE ProductVariants 
      SET stock_quantity = @stock_quantity 
      WHERE variant_id = @variant_id
    `;
    const params = {
      stock_quantity: { type: sql.Int, value: stock_quantity },
      variant_id: { type: sql.Int, value: variantId }
    };
    const result = await query(queryStr, params);
    console.log('ROWS AFFECTED:', result.rowsAffected);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit();
}

test();
