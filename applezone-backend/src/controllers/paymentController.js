const { query, sql } = require('../config/db');

// ─── POST /api/v1/payments/:orderId ───────────────────────────────────────────
async function processPayment(req, res) {
  try {
    const order_id = parseInt(req.params.orderId);
    const user_id  = req.user.user_id;
    const { method } = req.body;

    if (!method) {
      return res.status(400).json({ detail: 'Phương thức thanh toán (method) là bắt buộc' });
    }

    // Kiểm tra order thuộc user và chưa thanh toán
    const orderRes = await query(
      `SELECT order_id, CAST(final_amount AS FLOAT) AS final_amount, payment_status
       FROM orders WHERE order_id = @order_id AND user_id = @user_id`,
      {
        order_id: { type: sql.Int, value: order_id },
        user_id:  { type: sql.Int, value: user_id },
      }
    );

    if (!orderRes.recordset.length) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    const order = orderRes.recordset[0];
    if (order.payment_status === 'Paid') {
      return res.status(400).json({ detail: 'Đơn hàng đã được thanh toán' });
    }

    // Tạo payment record
    const payRes = await query(
      `INSERT INTO payments (order_id, payment_method, amount, payment_status, paid_at)
       OUTPUT INSERTED.payment_id
       VALUES (@order_id, @method, @amount, 'Paid', GETDATE())`,
      {
        order_id: { type: sql.Int,          value: order_id },
        method:   { type: sql.NVarChar(50), value: method },
        amount:   { type: sql.Decimal(18,2), value: order.final_amount },
      }
    );

    // Cập nhật payment_status của order
    await query(
      `UPDATE orders SET payment_status = 'Paid' WHERE order_id = @order_id`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    return res.json({
      message: 'Payment successful',
      payment_id: payRes.recordset[0].payment_id,
    });
  } catch (err) {
    console.error('[paymentController.processPayment]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = { processPayment };
