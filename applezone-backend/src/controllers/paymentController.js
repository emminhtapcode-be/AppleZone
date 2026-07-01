const { query, sql } = require('../config/db');
const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');
const vnpayConfig = require('../config/vnpay');

// Helper sort object for VNPay
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

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

// ─── POST /api/payments/create_payment_url ────────────────────────────────
async function create_payment_url(req, res) {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ detail: 'order_id is required' });
    }

    const orderRes = await query(
      `SELECT order_id, CAST(final_amount AS FLOAT) AS final_amount
       FROM Orders WHERE order_id = @order_id`,
      { order_id: { type: sql.Int, value: order_id } }
    );

    if (!orderRes.recordset.length) {
      return res.status(404).json({ detail: 'Order not found' });
    }
    const order = orderRes.recordset[0];
    const amount = order.final_amount;

    process.env.TZ = 'Asia/Ho_Chi_Minh';
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let tmnCode = vnpayConfig.vnp_TmnCode;
    let secretKey = vnpayConfig.vnp_HashSecret;
    let vnpUrl = vnpayConfig.vnp_Url;
    let returnUrl = vnpayConfig.vnp_ReturnUrl;

    let expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = order_id;
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang ' + order_id;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    vnp_Params = sortObject(vnp_Params);

    let signData = qs.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return res.json({ paymentUrl: vnpUrl });
  } catch (error) {
    console.error('[create_payment_url]', error);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── GET /api/payments/vnpay_return ───────────────────────────────────────
async function vnpay_return(req, res) {
  let vnp_Params = req.query;

  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  let tmnCode = vnpayConfig.vnp_TmnCode;
  let secretKey = vnpayConfig.vnp_HashSecret;

  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     

  let redirectUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';

  if(secureHash === signed){
    if (vnp_Params['vnp_ResponseCode'] == '00') {
      return res.redirect(`${redirectUrl}/payment/success?orderId=${vnp_Params['vnp_TxnRef']}`);
    } else {
      return res.redirect(`${redirectUrl}/payment/failed`);
    }
  } else {
    return res.redirect(`${redirectUrl}/payment/failed`);
  }
}

// ─── GET /api/payments/vnpay_ipn ──────────────────────────────────────────
async function vnpay_ipn(req, res) {
  let vnp_Params = req.query;
  let secureHash = vnp_Params['vnp_SecureHash'];
  
  let orderId = vnp_Params['vnp_TxnRef'];
  let rspCode = vnp_Params['vnp_ResponseCode'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  let secretKey = vnpayConfig.vnp_HashSecret;
  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");     

  if(secureHash === signed){
    const orderRes = await query(
      `SELECT order_id, CAST(final_amount AS FLOAT) AS final_amount, payment_status
       FROM Orders WHERE order_id = @order_id`,
      { order_id: { type: sql.Int, value: orderId } }
    );
    if (!orderRes.recordset.length) {
      return res.status(200).json({RspCode: '01', Message: 'Order not found'});
    }
    const order = orderRes.recordset[0];
    if(order.payment_status === 'Paid') {
      return res.status(200).json({RspCode: '02', Message: 'Order already confirmed'});
    }

    if (rspCode == '00') {
      // Gọi stored procedure sp_ConfirmPayment
      await query(
        `EXEC sp_ConfirmPayment @order_id = @order_id, @payment_method = 'VNPay', @amount = @amount`,
        {
          order_id:       { type: sql.Int, value: orderId },
          amount:         { type: sql.Decimal(18,2), value: order.final_amount },
        }
      );
      // Create warranties
      await query(
        `INSERT INTO Warranties (order_item_id, serial_number, start_date, end_date, status)
         SELECT oi.order_item_id, UPPER(NEWID()), CAST(GETDATE() AS DATE), CAST(DATEADD(YEAR, 1, GETDATE()) AS DATE), 'Active'
         FROM OrderItems oi
         WHERE oi.order_id = @order_id
           AND NOT EXISTS (SELECT 1 FROM Warranties w WHERE w.order_item_id = oi.order_item_id)`,
        { order_id: { type: sql.Int, value: orderId } }
      );
      return res.status(200).json({RspCode: '00', Message: 'Success'});
    } else {
      return res.status(200).json({RspCode: '00', Message: 'Success'});
    }
  } else {
    return res.status(200).json({RspCode: '97', Message: 'Checksum failed'});
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

module.exports = { confirmPayment, getPaymentHistory, validateCoupon, getCoupons, createCoupon, create_payment_url, vnpay_return, vnpay_ipn };
