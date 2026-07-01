const { query, sql } = require('../src/config/db');

async function main() {
  const constraints = await query(`
    SELECT cc.name
    FROM sys.check_constraints cc
    JOIN sys.tables t ON cc.parent_object_id = t.object_id
    WHERE t.name = 'Payments'
      AND cc.definition LIKE '%payment_method%'
  `);

  for (const row of constraints.recordset) {
    await query(`ALTER TABLE Payments DROP CONSTRAINT ${row.name}`);
    console.log(`Dropped constraint ${row.name}`);
  }

  await query(`
    ALTER TABLE Payments
    ADD CONSTRAINT CK_Payments_payment_method
    CHECK (payment_method IN ('COD','banking','ewallet','installment','VNPay'))
  `);
  console.log('Added CK_Payments_payment_method with VNPay');

  const result = await query(`
    SELECT cc.name, cc.definition
    FROM sys.check_constraints cc
    JOIN sys.tables t ON cc.parent_object_id = t.object_id
    WHERE t.name = 'Payments'
      AND cc.definition LIKE '%payment_method%'
  `);
  console.log(result.recordset);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
