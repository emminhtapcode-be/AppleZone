const sql    = require('mssql');
const { query, getPool } = require('../config/db');

// ─── POST /api/v1/orders ──────────────────────────────────────────────────────
async function createOrder(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { shipping_address_id, coupon_code, items } = req.body;
    const user_id = req.user.user_id;

    if (!shipping_address_id || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ detail: 'shipping_address_id và items là bắt buộc' });
    }

    await transaction.begin();

    // Helper request trong transaction
    const txQuery = async (queryStr, params = {}) => {
      const r = transaction.request();
      for (const [key, { type, value }] of Object.entries(params)) {
        r.input(key, type, value);
      }
      return r.query(queryStr);
    };

    // ── 1. Validate variants + tính tổng ──
    let total = 0;
    const itemsData = [];

    for (const item of items) {
      const vRes = await txQuery(
        'SELECT variant_id, CAST(price AS FLOAT) AS price, stock_quantity FROM product_variants WHERE variant_id = @id',
        { id: { type: sql.Int, value: item.variant_id } }
      );
      if (!vRes.recordset.length) {
        await transaction.rollback();
        return res.status(400).json({ detail: `Variant ${item.variant_id} không tồn tại` });
      }
      const v = vRes.recordset[0];
      if (v.stock_quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ detail: `Variant ${item.variant_id} không đủ hàng` });
      }
      total += v.price * item.quantity;
      itemsData.push({ variant_id: v.variant_id, quantity: item.quantity, unit_price: v.price });
    }

    // ── 2. Xử lý coupon ──
    let discount  = 0;
    let coupon_id = null;

    if (coupon_code) {
      const cpRes = await txQuery(
        `SELECT coupon_id, discount_type, CAST(discount_value AS FLOAT) AS discount_value
         FROM coupons WHERE code = @code AND end_date > GETDATE()`,
        { code: { type: sql.NVarChar, value: coupon_code } }
      );
      if (cpRes.recordset.length) {
        const cp = cpRes.recordset[0];
        coupon_id = cp.coupon_id;
        discount  = cp.discount_type === 'Percentage'
          ? total * cp.discount_value / 100
          : cp.discount_value;
        await txQuery(
          'UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = @id',
          { id: { type: sql.Int, value: coupon_id } }
        );
      }
    }

    const final_amount = total - discount;

    // ── 3. Tạo đơn hàng ──
    const orderRes = await txQuery(
      `INSERT INTO orders
         (user_id, shipping_address_id, coupon_id, total_amount, discount_amount, final_amount, order_status, payment_status)
       OUTPUT INSERTED.order_id, CAST(INSERTED.total_amount AS FLOAT) AS total_amount,
              CAST(INSERTED.discount_amount AS FLOAT) AS discount_amount,
              CAST(INSERTED.final_amount AS FLOAT) AS final_amount,
              INSERTED.order_status, INSERTED.payment_status, INSERTED.created_at
       VALUES (@user_id, @addr_id, @coupon_id, @total, @discount, @final, 'Pending', 'Unpaid')`,
      {
        user_id:   { type: sql.Int,          value: user_id },
        addr_id:   { type: sql.Int,          value: shipping_address_id },
        coupon_id: { type: sql.Int,          value: coupon_id },
        total:     { type: sql.Decimal(18,2), value: total },
        discount:  { type: sql.Decimal(18,2), value: discount },
        final:     { type: sql.Decimal(18,2), value: final_amount },
      }
    );
    const order    = orderRes.recordset[0];
    const order_id = order.order_id;

    // ── 4. Insert order items + trừ stock ──
    for (const item of itemsData) {
      await txQuery(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price, discount_amount)
         VALUES (@order_id, @variant_id, @qty, @price, 0)`,
        {
          order_id:   { type: sql.Int,          value: order_id },
          variant_id: { type: sql.Int,          value: item.variant_id },
          qty:        { type: sql.Int,          value: item.quantity },
          price:      { type: sql.Decimal(18,2), value: item.unit_price },
        }
      );
      await txQuery(
        'UPDATE product_variants SET stock_quantity = stock_quantity - @qty WHERE variant_id = @id',
        {
          qty: { type: sql.Int, value: item.quantity },
          id:  { type: sql.Int, value: item.variant_id },
        }
      );
    }

    // ── 5. Ghi tracking ──
    await txQuery(
      `INSERT INTO order_tracking (order_id, status, note) VALUES (@order_id, 'Pending', 'Order created')`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    await transaction.commit();
    return res.status(201).json(order);
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    console.error('[orderController.createOrder]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/v1/orders ───────────────────────────────────────────────────────
async function getMyOrders(req, res) {
  try {
    const result = await query(
      `SELECT order_id, CAST(total_amount AS FLOAT) AS total_amount,
              CAST(discount_amount AS FLOAT) AS discount_amount,
              CAST(final_amount AS FLOAT) AS final_amount,
              order_status, payment_status, created_at
       FROM orders WHERE user_id = @user_id
       ORDER BY created_at DESC`,
      { user_id: { type: sql.Int, value: req.user.user_id } }
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[orderController.getMyOrders]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/v1/orders/:id ───────────────────────────────────────────────────
async function getOrder(req, res) {
  try {
    const order_id = parseInt(req.params.id);
    const user_id  = req.user.user_id;

    const result = await query(
      `SELECT
         o.order_id,
         CAST(o.total_amount    AS FLOAT) AS total_amount,
         CAST(o.discount_amount AS FLOAT) AS discount_amount,
         CAST(o.final_amount    AS FLOAT) AS final_amount,
         o.order_status, o.payment_status, o.created_at,
         (
           SELECT oi.order_item_id, oi.variant_id, oi.quantity,
                  CAST(oi.unit_price AS FLOAT) AS unit_price,
                  v.color, v.storage, v.sku,
                  p.product_name, p.thumbnail_url
           FROM order_items oi
           LEFT JOIN product_variants v ON v.variant_id = oi.variant_id
           LEFT JOIN products          p ON p.product_id  = v.product_id
           WHERE oi.order_id = o.order_id
           FOR JSON PATH
         ) AS items
       FROM orders o
       WHERE o.order_id = @order_id AND o.user_id = @user_id`,
      {
        order_id: { type: sql.Int, value: order_id },
        user_id:  { type: sql.Int, value: user_id },
      }
    );

    if (!result.recordset.length) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    const row = result.recordset[0];
    return res.json({ ...row, items: row.items ? JSON.parse(row.items) : [] });
  } catch (err) {
    console.error('[orderController.getOrder]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = { createOrder, getMyOrders, getOrder };
