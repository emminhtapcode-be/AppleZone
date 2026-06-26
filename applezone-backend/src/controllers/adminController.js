const { query, sql } = require('../config/db');

// ─── GET /api/v1/admin/orders ─────────────────────────────────────────────────
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
       FROM orders o
       LEFT JOIN users u ON u.user_id = o.user_id
       ORDER BY o.created_at DESC`
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[adminController.getAllOrders]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── PATCH /api/v1/admin/orders/:id/status ────────────────────────────────────
async function updateOrderStatus(req, res) {
  try {
    const order_id = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        detail: `Status không hợp lệ. Chọn một trong: ${validStatuses.join(', ')}`,
      });
    }

    const result = await query(
      `UPDATE orders SET order_status = @status WHERE order_id = @order_id`,
      {
        status:   { type: sql.NVarChar(50), value: status },
        order_id: { type: sql.Int,          value: order_id },
      }
    );

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    // Ghi tracking
    await query(
      `INSERT INTO order_tracking (order_id, status, note)
       VALUES (@order_id, @status, @note)`,
      {
        order_id: { type: sql.Int,          value: order_id },
        status:   { type: sql.NVarChar(50), value: status },
        note:     { type: sql.NVarChar(255), value: `Status updated to ${status} by admin` },
      }
    );

    return res.json({ message: `Order status updated to ${status}` });
  } catch (err) {
    console.error('[adminController.updateOrderStatus]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = { getAllOrders, updateOrderStatus };
