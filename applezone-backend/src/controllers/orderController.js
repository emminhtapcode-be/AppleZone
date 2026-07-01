const sql = require('mssql');
const { query, getPool } = require('../config/db');

const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

// ─── POST /api/orders ─────────────────────────────────────────────────────────
async function createOrder(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const shipping_address_id = req.body.shipping_address_id ?? req.body.address_id;
    const { coupon_code, items } = req.body;
    const user_id = req.user.user_id;

    if (!shipping_address_id || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ detail: 'shipping_address_id và items là bắt buộc' });
    }

    for (const item of items) {
      if (!item.variant_id || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ detail: 'Mỗi item cần variant_id và quantity >= 1' });
      }
    }

    await transaction.begin();

    const txQuery = async (queryStr, params = {}) => {
      const r = transaction.request();
      for (const [key, { type, value }] of Object.entries(params)) {
        r.input(key, type, value);
      }
      return r.query(queryStr);
    };

    let final_address_id = null;
    if (shipping_address_id && shipping_address_id !== -1) {
      const addrRes = await txQuery(
        `SELECT address_id FROM UserAddresses
         WHERE address_id = @addr_id AND user_id = @user_id`,
        {
          addr_id: { type: sql.Int, value: shipping_address_id },
          user_id: { type: sql.Int, value: user_id },
        }
      );
      if (!addrRes.recordset.length) {
        await transaction.rollback();
        return res.status(400).json({ detail: 'Địa chỉ giao hàng không hợp lệ' });
      }
      final_address_id = shipping_address_id;
    }

    let total = 0;
    const itemsData = [];

    for (const item of items) {
      const vRes = await txQuery(
        `SELECT variant_id, CAST(price AS FLOAT) AS price, stock_quantity
         FROM ProductVariants WITH (UPDLOCK, ROWLOCK)
         WHERE variant_id = @id AND status = 'active'`,
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

    let discount = 0;
    let coupon_id = null;

    if (coupon_code) {
      const cpRes = await txQuery(
        `SELECT coupon_id, discount_type, CAST(discount_value AS FLOAT) AS discount_value,
                CAST(min_order_value AS FLOAT) AS min_order_value,
                CAST(max_discount AS FLOAT) AS max_discount,
                usage_limit, used_count
         FROM Coupons
         WHERE coupon_code = @code AND status = 1
           AND start_date <= GETDATE() AND end_date > GETDATE()`,
        { code: { type: sql.NVarChar, value: coupon_code } }
      );
      if (!cpRes.recordset.length) {
        await transaction.rollback();
        return res.status(400).json({ detail: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
      }
      const cp = cpRes.recordset[0];
      if (cp.usage_limit !== null && cp.used_count >= cp.usage_limit) {
        await transaction.rollback();
        return res.status(400).json({ detail: 'Mã giảm giá đã đạt giới hạn sử dụng' });
      }
      if (cp.min_order_value && total < cp.min_order_value) {
        await transaction.rollback();
        return res.status(400).json({ detail: `Đơn hàng tối thiểu ${cp.min_order_value} để dùng mã này` });
      }

      coupon_id = cp.coupon_id;
      discount = cp.discount_type === 'Percentage' || cp.discount_type === 'percent'
        ? total * cp.discount_value / 100
        : cp.discount_value;
      if (cp.max_discount && discount > cp.max_discount) {
        discount = cp.max_discount;
      }

      await txQuery(
        'UPDATE Coupons SET used_count = used_count + 1 WHERE coupon_id = @id',
        { id: { type: sql.Int, value: coupon_id } }
      );
    }

    const final_amount = Math.max(total - discount, 0);

    const orderRes = await txQuery(
      `INSERT INTO Orders
         (user_id, address_id, coupon_id, total_amount, discount_amount, final_amount, order_status, payment_status)
       OUTPUT INSERTED.order_id, CAST(INSERTED.total_amount AS FLOAT) AS total_amount,
              CAST(INSERTED.discount_amount AS FLOAT) AS discount_amount,
              CAST(INSERTED.final_amount AS FLOAT) AS final_amount,
              INSERTED.order_status, INSERTED.payment_status, INSERTED.created_at
       VALUES (@user_id, @addr_id, @coupon_id, @total, @discount, @final, 'pending', 'unpaid')`,
      {
        user_id:   { type: sql.Int, value: user_id },
        addr_id:   { type: sql.Int, value: final_address_id },
        coupon_id: { type: sql.Int, value: coupon_id },
        total:     { type: sql.Decimal(18, 2), value: total },
        discount:  { type: sql.Decimal(18, 2), value: discount },
        final:     { type: sql.Decimal(18, 2), value: final_amount },
      }
    );
    const order = orderRes.recordset[0];
    const order_id = order.order_id;

    for (const item of itemsData) {
      await txQuery(
        `INSERT INTO OrderItems (order_id, variant_id, quantity, unit_price)
         VALUES (@order_id, @variant_id, @qty, @price)`,
        {
          order_id:   { type: sql.Int, value: order_id },
          variant_id: { type: sql.Int, value: item.variant_id },
          qty:        { type: sql.Int, value: item.quantity },
          price:      { type: sql.Decimal(18, 2), value: item.unit_price },
        }
      );
      await txQuery(
        'UPDATE ProductVariants SET stock_quantity = stock_quantity - @qty WHERE variant_id = @id',
        {
          qty: { type: sql.Int, value: item.quantity },
          id:  { type: sql.Int, value: item.variant_id },
        }
      );
    }

    await txQuery(
      `INSERT INTO OrderTracking (order_id, status, note) VALUES (@order_id, 'pending', 'Order created')`,
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

// ─── GET /api/orders ──────────────────────────────────────────────────────────
async function getMyOrders(req, res) {
  try {
    const result = await query(
      `SELECT order_id, CAST(total_amount AS FLOAT) AS total_amount,
              CAST(discount_amount AS FLOAT) AS discount_amount,
              CAST(final_amount AS FLOAT) AS final_amount,
              order_status, payment_status, created_at
       FROM Orders WHERE user_id = @user_id
       ORDER BY created_at DESC`,
      { user_id: { type: sql.Int, value: req.user.user_id } }
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[orderController.getMyOrders]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
async function getOrder(req, res) {
  try {
    const order_id = parseInt(req.params.id);
    const user_id = req.user.user_id;

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
           FROM OrderItems oi
           LEFT JOIN ProductVariants v ON v.variant_id = oi.variant_id
           LEFT JOIN Products          p ON p.product_id  = v.product_id
           WHERE oi.order_id = o.order_id
           FOR JSON PATH
         ) AS items
       FROM Orders o
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

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
async function getAllOrders(req, res) {
  try {
    const result = await query(
      `SELECT
         o.order_id, o.user_id,
         u.full_name, u.email,
         CAST(o.total_amount    AS FLOAT) AS total_amount,
         CAST(o.discount_amount AS FLOAT) AS discount_amount,
         CAST(o.final_amount    AS FLOAT) AS final_amount,
         o.order_status, o.payment_status, o.created_at
       FROM Orders o
       LEFT JOIN Users u ON u.USER_ID = o.user_id
       ORDER BY o.created_at DESC`
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[orderController.getAllOrders]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── PUT /api/orders/:id/cancel ───────────────────────────────────────────────
async function cancelOrder(req, res) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  
  try {
    const order_id = parseInt(req.params.id);
    const user_id = req.user.user_id;

    await transaction.begin();

    const txQuery = async (queryStr, params = {}) => {
      const r = transaction.request();
      for (const [key, { type, value }] of Object.entries(params)) {
        r.input(key, type, value);
      }
      return r.query(queryStr);
    };

    // Kiểm tra đơn hàng của user và trạng thái Pending
    const orderRes = await txQuery(
      `SELECT order_status FROM Orders WHERE order_id = @order_id AND user_id = @user_id`,
      {
        order_id: { type: sql.Int, value: order_id },
        user_id:  { type: sql.Int, value: user_id },
      }
    );

    if (!orderRes.recordset.length) {
      await transaction.rollback();
      return res.status(404).json({ detail: 'Order not found or unauthorized' });
    }

    const order = orderRes.recordset[0];
    if (order.order_status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({ detail: 'Chỉ có thể hủy đơn ở trạng thái pending' });
    }

    // Hoàn lại kho (cộng số lượng quantity vào stock_quantity)
    await txQuery(`
      UPDATE pv
      SET pv.stock_quantity = pv.stock_quantity + oi.quantity
      FROM ProductVariants pv
      JOIN OrderItems oi ON pv.variant_id = oi.variant_id
      WHERE oi.order_id = @order_id
    `, { order_id: { type: sql.Int, value: order_id } });

    // Cập nhật trạng thái đơn hàng thành Cancelled
    await txQuery(`
      UPDATE Orders SET order_status = 'cancelled' WHERE order_id = @order_id
    `, { order_id: { type: sql.Int, value: order_id } });

    await txQuery(
      `INSERT INTO OrderTracking (order_id, status, note) VALUES (@order_id, 'cancelled', 'Customer cancelled the order')`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    await transaction.commit();
    return res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    try { await transaction.rollback(); } catch (_) {}
    console.error('[orderController.cancelOrder]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── PUT /api/admin/orders/:id ────────────────────────────────────────────────
async function updateOrderStatus(req, res) {
  try {
    const order_id = parseInt(req.params.id);
    const status = req.body.status ? String(req.body.status).toLowerCase() : null;

    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        detail: `Status không hợp lệ. Chọn một trong: ${ORDER_STATUSES.join(', ')}`,
      });
    }

    let updateQuery = `UPDATE Orders SET order_status = @status WHERE order_id = @order_id`;
    if (status === 'Delivered') {
      updateQuery = `UPDATE Orders SET order_status = @status, payment_status = 'Paid' WHERE order_id = @order_id`;
    }

    const result = await query(
      updateQuery,
      {
        status:   { type: sql.NVarChar(50), value: status },
        order_id: { type: sql.Int, value: order_id },
      }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    await query(
      `INSERT INTO OrderTracking (order_id, status, note)
       VALUES (@order_id, @status, @note)`,
      {
        order_id: { type: sql.Int, value: order_id },
        status:   { type: sql.NVarChar(50), value: status },
        note:     { type: sql.NVarChar(255), value: `Status updated to ${status}` },
      }
    );

    // Tự động tạo Bảo hành (Warranties) khi đơn hàng chuyển sang Confirmed
    if (status === 'confirmed') {
      await query(
        `INSERT INTO Warranties (order_item_id, serial_number, start_date, end_date, status)
         SELECT oi.order_item_id, UPPER(NEWID()), CAST(GETDATE() AS DATE), CAST(DATEADD(YEAR, 1, GETDATE()) AS DATE), 'active'
         FROM OrderItems oi
         WHERE oi.order_id = @order_id
           AND NOT EXISTS (SELECT 1 FROM Warranties w WHERE w.order_item_id = oi.order_item_id)`,
        { order_id: { type: sql.Int, value: order_id } }
      );
    }

    return res.json({ message: `Order status updated to ${status}` });
  } catch (err) {
    console.error('[orderController.updateOrderStatus]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
};
