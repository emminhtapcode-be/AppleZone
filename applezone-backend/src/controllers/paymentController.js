const { query, sql } = require('../config/db');
const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');
const vnpayConfig = require('../config/vnpay');

// ── Helpers ──────────────────────────────────────────────────────────────────

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[encodeURIComponent(key)] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }
  return sorted;
}

async function getOrderById(orderId) {
  const result = await query(
    `SELECT order_id, CAST(final_amount AS FLOAT) AS final_amount, payment_status
     FROM Orders
     WHERE order_id = @order_id`,
    { order_id: { type: sql.Int, value: parseInt(orderId, 10) } }
  );
  return result.recordset[0] || null;
}

async function markOrderPaid(orderId, paymentMethod = 'VNPay') {
  const order = await getOrderById(orderId);
  if (!order) return { ok: false, code: 'ORDER_NOT_FOUND' };
  if (String(order.payment_status).toLowerCase() === 'paid') {
    return { ok: true, alreadyPaid: true, order };
  }

  // Insert payment record
  await query(
    `INSERT INTO Payments (order_id, payment_method, amount, payment_status, paid_at)
     VALUES (@order_id, @payment_method, @amount, 'completed', GETDATE())`,
    {
      order_id:       { type: sql.Int, value: order.order_id },
      payment_method: { type: sql.VarChar(20), value: paymentMethod },
      amount:         { type: sql.Decimal(18, 2), value: order.final_amount },
    }
  );

  // Update order status
  await query(
    `UPDATE Orders
     SET payment_status = 'paid', order_status = 'confirmed'
     WHERE order_id = @order_id`,
    { order_id: { type: sql.Int, value: order.order_id } }
  );

  // Add tracking record
  await query(
    `INSERT INTO OrderTracking (order_id, status, note)
     VALUES (@order_id, 'confirmed', 'Payment confirmed via VNPay')`,
    { order_id: { type: sql.Int, value: order.order_id } }
  );

  // Auto-create warranties
  await query(
    `INSERT INTO Warranties (order_item_id, serial_number, start_date, end_date, status)
     SELECT oi.order_item_id, UPPER(NEWID()), CAST(GETDATE() AS DATE), CAST(DATEADD(YEAR, 1, GETDATE()) AS DATE), 'active'
     FROM OrderItems oi
     WHERE oi.order_id = @order_id
       AND NOT EXISTS (SELECT 1 FROM Warranties w WHERE w.order_item_id = oi.order_item_id)`,
    { order_id: { type: sql.Int, value: order.order_id } }
  );

  return { ok: true, alreadyPaid: false, order };
}

async function markOrderPaymentFailed(orderId, paymentMethod = 'VNPay') {
  const order = await getOrderById(orderId);
  if (!order || String(order.payment_status).toLowerCase() === 'paid') return;

  await query(
    `INSERT INTO Payments (order_id, payment_method, amount, payment_status, paid_at)
     VALUES (@order_id, @payment_method, @amount, 'failed', GETDATE())`,
    {
      order_id:       { type: sql.Int, value: order.order_id },
      payment_method: { type: sql.VarChar(20), value: paymentMethod },
      amount:         { type: sql.Decimal(18, 2), value: order.final_amount },
    }
  );
}

function verifyVnpaySignature(vnpParams) {
  const params = { ...vnpParams };
  const secureHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signed = crypto
    .createHmac('sha512', vnpayConfig.vnp_HashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return secureHash === signed;
}

// ── POST /api/v1/payments/vnpay/create_payment_url ───────────────────────────
// Frontend gọi sau khi tạo order, trả về paymentUrl để redirect tới VNPay
async function createPaymentUrl(req, res) {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ detail: 'order_id is required' });
    }

    const order = await getOrderById(order_id);
    if (!order) {
      return res.status(404).json({ detail: 'Order not found' });
    }
    if (String(order.payment_status).toLowerCase() === 'paid') {
      return res.status(400).json({ detail: 'Order already paid' });
    }

    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

    const ipAddr = (
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();

    let vnpParams = {
      vnp_Version:    '2.1.0',
      vnp_Command:    'pay',
      vnp_TmnCode:    vnpayConfig.vnp_TmnCode,
      vnp_Locale:     'vn',
      vnp_CurrCode:   'VND',
      vnp_TxnRef:     String(order.order_id),
      vnp_OrderInfo:  `Thanh toan don hang #${order.order_id}`,
      vnp_OrderType:  'other',
      vnp_Amount:     Math.round(order.final_amount * 100),
      vnp_ReturnUrl:  vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr:     ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    vnpParams = sortObject(vnpParams);

    const signData = qs.stringify(vnpParams, { encode: false });
    const secureHash = crypto
      .createHmac('sha512', vnpayConfig.vnp_HashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    vnpParams.vnp_SecureHash = secureHash;

    const paymentUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(vnpParams, { encode: false })}`;

    return res.json({ paymentUrl });
  } catch (error) {
    console.error('[paymentController.createPaymentUrl]', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ── POST /api/v1/payments/vnpay/verify ───────────────────────────────────────
// Frontend gọi sau khi VNPay redirect về /payment/result?vnp_...
// Gửi toàn bộ query params từ URL lên để backend verify chữ ký & xử lý
async function vnpayVerify(req, res) {
  try {
    const vnpParams = req.body; // Frontend gửi toàn bộ query params lên

    if (!vnpParams || !vnpParams.vnp_SecureHash) {
      return res.status(400).json({
        success: false,
        message: 'Missing VNPay parameters',
      });
    }

    const orderId = vnpParams.vnp_TxnRef;
    const isValid = verifyVnpaySignature(vnpParams);

    if (!isValid) {
      return res.json({
        success: false,
        message: 'Chữ ký không hợp lệ. Giao dịch có thể bị giả mạo.',
        orderId,
      });
    }

    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;

    if (responseCode === '00' && transactionStatus === '00') {
      // Thanh toán thành công
      const result = await markOrderPaid(orderId, 'VNPay');

      if (!result.ok) {
        return res.json({
          success: false,
          message: 'Order not found',
          orderId,
        });
      }

      return res.json({
        success: true,
        message: result.alreadyPaid
          ? 'Đơn hàng đã được thanh toán trước đó.'
          : 'Thanh toán thành công!',
        orderId,
        amount: parseInt(vnpParams.vnp_Amount, 10) / 100,
        transactionNo: vnpParams.vnp_TransactionNo || '',
        bankCode: vnpParams.vnp_BankCode || '',
        payDate: vnpParams.vnp_PayDate || '',
      });
    }

    // Thanh toán thất bại hoặc bị hủy
    await markOrderPaymentFailed(orderId, 'VNPay');

    const errorMessages = {
      '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ (liên hệ VNPay).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
      '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán. Vui lòng thử lại.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Quý khách nhập sai mật khẩu xác thực (OTP).',
      '24': 'Quý khách đã hủy giao dịch.',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định.',
    };

    return res.json({
      success: false,
      message: errorMessages[responseCode] || `Thanh toán thất bại (Mã lỗi: ${responseCode})`,
      orderId,
      responseCode,
    });
  } catch (error) {
    console.error('[paymentController.vnpayVerify]', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác minh thanh toán',
    });
  }
}

// ── VNPay server-to-server callback (IPN) ────────────────────────────────────
// Supports both GET and POST requests
async function vnpayIpn(req, res) {
  try {
    // VNPay may send GET (req.query) or POST (req.body)
    const vnpParams = Object.keys(req.query).length > 0 ? req.query : req.body;

    const isValid = verifyVnpaySignature(vnpParams);
    const orderId = vnpParams.vnp_TxnRef;

    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    const expectedAmount = Math.round(order.final_amount * 100);
    if (parseInt(vnpParams.vnp_Amount, 10) !== expectedAmount) {
      return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
    }

    if (String(order.payment_status).toLowerCase() === 'paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (vnpParams.vnp_ResponseCode === '00' && vnpParams.vnp_TransactionStatus === '00') {
      await markOrderPaid(orderId, 'VNPay');
    } else {
      await markOrderPaymentFailed(orderId, 'VNPay');
    }

    return res.status(200).json({ RspCode: '00', Message: 'Success' });
  } catch (error) {
    console.error('[paymentController.vnpayIpn]', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
}

// ── POST /api/v1/payments/confirm ────────────────────────────────────────────
// Manual payment confirmation (COD, BankTransfer, etc.)
async function confirmPayment(req, res) {
  try {
    const { order_id, payment_method } = req.body;
    if (!order_id || !payment_method) {
      return res.status(400).json({ detail: 'order_id and payment_method are required' });
    }

    const result = await markOrderPaid(order_id, payment_method);
    if (!result.ok) {
      return res.status(404).json({ detail: 'Order not found' });
    }

    return res.json({ message: 'Payment confirmed successfully' });
  } catch (err) {
    console.error('[paymentController.confirmPayment]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ── GET /api/v1/payments/:orderId ────────────────────────────────────────────
async function getPaymentHistory(req, res) {
  try {
    const order_id = parseInt(req.params.orderId, 10);
    const result = await query(
      `SELECT payment_id, order_id, payment_method, CAST(amount AS FLOAT) AS amount, payment_status, paid_at
       FROM Payments WHERE order_id = @order_id
       ORDER BY paid_at DESC`,
      { order_id: { type: sql.Int, value: order_id } }
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[paymentController.getPaymentHistory]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ── POST /api/v1/coupons/validate ────────────────────────────────────────────
async function validateCoupon(req, res) {
  try {
    const { coupon_code } = req.body;
    if (!coupon_code) {
      return res.status(400).json({ detail: 'coupon_code is required' });
    }

    const result = await query(
      `SELECT coupon_id, code, discount_type, CAST(discount_value AS FLOAT) AS discount_value,
              CAST(min_order_amount AS FLOAT) AS min_order_amount, start_date, end_date, usage_limit, used_count
       FROM Coupons
       WHERE code = @code AND end_date > GETDATE() AND start_date <= GETDATE()`,
      { code: { type: sql.NVarChar, value: coupon_code } }
    );

    if (!result.recordset.length) {
      return res.status(400).json({ detail: 'Coupon is invalid or expired' });
    }

    const coupon = result.recordset[0];
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ detail: 'Coupon usage limit reached' });
    }

    return res.json({ valid: true, coupon });
  } catch (err) {
    console.error('[paymentController.validateCoupon]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ── GET /api/v1/admin/coupons ────────────────────────────────────────────────
async function getCoupons(req, res) {
  try {
    const result = await query(
      `SELECT coupon_id, code, discount_type, CAST(discount_value AS FLOAT) AS discount_value,
              CAST(min_order_amount AS FLOAT) AS min_order_amount, start_date, end_date, usage_limit, used_count
       FROM Coupons
       ORDER BY coupon_id DESC`
    );
    return res.json(result.recordset);
  } catch (err) {
    console.error('[paymentController.getCoupons]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ── POST /api/v1/admin/coupons ───────────────────────────────────────────────
async function createCoupon(req, res) {
  try {
    const { code, coupon_code, discount_type, discount_value, min_order_amount, start_date, end_date, usage_limit } = req.body;
    const couponCode = code || coupon_code;

    if (!couponCode || !discount_type || discount_value === undefined || !end_date) {
      return res.status(400).json({ detail: 'code, discount_type, discount_value and end_date are required' });
    }

    const result = await query(
      `INSERT INTO Coupons
         (code, discount_type, discount_value, min_order_amount, start_date, end_date, usage_limit, used_count)
       OUTPUT INSERTED.coupon_id, INSERTED.code, INSERTED.discount_type,
              CAST(INSERTED.discount_value AS FLOAT) AS discount_value
       VALUES (@code, @discount_type, @discount_value, @min_order_amount, @start_date, @end_date, @usage_limit, 0)`,
      {
        code:             { type: sql.NVarChar(50), value: couponCode },
        discount_type:    { type: sql.VarChar(20), value: discount_type },
        discount_value:   { type: sql.Decimal(18, 2), value: discount_value },
        min_order_amount: { type: sql.Decimal(18, 2), value: min_order_amount || 0 },
        start_date:       { type: sql.Date, value: start_date ? new Date(start_date) : new Date() },
        end_date:         { type: sql.Date, value: new Date(end_date) },
        usage_limit:      { type: sql.Int, value: usage_limit || null },
      }
    );

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[paymentController.createCoupon]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = {
  confirmPayment,
  getPaymentHistory,
  validateCoupon,
  getCoupons,
  createCoupon,
  createPaymentUrl,
  vnpayVerify,
  vnpayIpn,
};
