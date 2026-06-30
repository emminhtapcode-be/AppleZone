const { query, sql } = require('../config/db');

// ─── POST /api/payments/confirm ──────────────────────────────────────────────
async function confirmPayment(req, res) {
  try {
    const { order_id, payment_method } = req.body;

    if (!order_id || !payment_method) {
      return res.status(400).json({ detail: 'order_id và payment_method là bắt buộc' });
    }

    // Lấy thông tin đơn hàng
    const orderRes = await query(
      `SELECT order_id, CAST(final_amount AS FLOAT) AS final_amount, payment_status
       FROM Orders WHERE order_id = @order_id`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    if (!orderRes.recordset.length) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    const order = orderRes.recordset[0];
    if (order.payment_status === 'Paid') {
      return res.status(400).json({ detail: 'Đơn hàng đã được thanh toán' });
    }

    // Gọi stored procedure sp_ConfirmPayment
    await query(
      `EXEC sp_ConfirmPayment @order_id = @order_id, @payment_method = @payment_method, @amount = @amount`,
      {
        order_id:       { type: sql.Int, value: order_id },
        payment_method: { type: sql.NVarChar(50), value: payment_method },
        amount:         { type: sql.Decimal(18,2), value: order.final_amount },
      }
    );

    // Tự động tạo Bảo hành (Warranties) khi đơn hàng thanh toán xong
    await query(
      `INSERT INTO Warranties (order_item_id, serial_number, start_date, end_date, status)
       SELECT oi.order_item_id, UPPER(NEWID()), CAST(GETDATE() AS DATE), CAST(DATEADD(YEAR, 1, GETDATE()) AS DATE), 'Active'
       FROM OrderItems oi
       WHERE oi.order_id = @order_id
         AND NOT EXISTS (SELECT 1 FROM Warranties w WHERE w.order_item_id = oi.order_item_id)`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    return res.json({ message: 'Payment confirmed successfully via sp_ConfirmPayment' });
  } catch (err) {
    console.error('[paymentController.confirmPayment]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/payments/:orderId ───────────────────────────────────────────────
async function getPaymentHistory(req, res) {
  try {
    const order_id = parseInt(req.params.orderId);

    const result = await query(
      `SELECT payment_id, order_id, payment_method, CAST(amount AS FLOAT) AS amount, payment_status, paid_at
       FROM Payments WHERE order_id = @order_id`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    return res.json(result.recordset);
  } catch (err) {
    console.error('[paymentController.getPaymentHistory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── POST /api/coupons/validate ──────────────────────────────────────────────
async function validateCoupon(req, res) {
  try {
    const { coupon_code } = req.body;

    if (!coupon_code) {
      return res.status(400).json({ detail: 'coupon_code là bắt buộc' });
    }

    const result = await query(
      `SELECT coupon_id, coupon_code, discount_type, CAST(discount_value AS FLOAT) AS discount_value,
              CAST(min_order_value AS FLOAT) AS min_order_value, CAST(max_discount AS FLOAT) AS max_discount,
              start_date, end_date, usage_limit, used_count, status
       FROM Coupons
       WHERE coupon_code = @code AND status = 1 AND end_date > GETDATE() AND start_date <= GETDATE()`,
      { code: { type: sql.NVarChar, value: coupon_code } }
    );

    if (!result.recordset.length) {
      return res.status(400).json({ detail: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
    }

    const coupon = result.recordset[0];
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ detail: 'Mã giảm giá đã đạt số lần giới hạn sử dụng' });
    }

    return res.json({
      valid: true,
      coupon
    });
  } catch (err) {
    console.error('[paymentController.validateCoupon]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/admin/coupons ───────────────────────────────────────────────────
async function getCoupons(req, res) {
  try {
    const result = await query(
      `SELECT coupon_id, coupon_code, discount_type, CAST(discount_value AS FLOAT) AS discount_value,
              CAST(min_order_value AS FLOAT) AS min_order_value, CAST(max_discount AS FLOAT) AS max_discount,
              start_date, end_date, usage_limit, used_count, status
       FROM Coupons
       ORDER BY coupon_id DESC`
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[paymentController.getCoupons]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── POST /api/admin/coupons ──────────────────────────────────────────────────
async function createCoupon(req, res) {
  try {
    const { coupon_code, discount_type, discount_value, min_order_value, max_discount, start_date, end_date, usage_limit } = req.body;

    if (!coupon_code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ detail: 'coupon_code, discount_type và discount_value là bắt buộc' });
    }

    const result = await query(
      `INSERT INTO Coupons
         (coupon_code, discount_type, discount_value, min_order_value, max_discount, start_date, end_date, usage_limit, used_count, status)
       OUTPUT INSERTED.coupon_id, INSERTED.coupon_code, INSERTED.discount_type,
              CAST(INSERTED.discount_value AS FLOAT) AS discount_value, INSERTED.status
       VALUES (@coupon_code, @discount_type, @discount_value, @min_order_value, @max_discount, @start_date, @end_date, @usage_limit, 0, 1)`,
      {
        coupon_code:     { type: sql.NVarChar(50), value: coupon_code },
        discount_type:   { type: sql.VarChar(20),  value: discount_type },
        discount_value:  { type: sql.Decimal(18,2), value: discount_value },
        min_order_value: { type: sql.Decimal(18,2), value: min_order_value || null },
        max_discount:    { type: sql.Decimal(18,2), value: max_discount || null },
        start_date:      { type: sql.DateTime,     value: start_date ? new Date(start_date) : new Date() },
        end_date:        { type: sql.DateTime,     value: end_date ? new Date(end_date) : null },
        usage_limit:     { type: sql.Int,          value: usage_limit || null },
      }
    );

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[paymentController.createCoupon]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = { confirmPayment, getPaymentHistory, validateCoupon, getCoupons, createCoupon };
