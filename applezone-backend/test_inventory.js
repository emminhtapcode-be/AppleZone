require('dotenv').config();
const { query } = require('./src/config/db');

async function test() {
  try {
    const queryStr = `
      SELECT pv.variant_id, p.product_name, pv.color, pv.storage, pv.sku, pv.stock_quantity, pv.status
      FROM ProductVariants pv
      JOIN Products p ON pv.product_id = p.product_id
      ORDER BY p.product_name, pv.color, pv.storage
    `;
    const result = await query(queryStr);
    console.log('SUCCESS:', result.recordset);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit();
}

test();
