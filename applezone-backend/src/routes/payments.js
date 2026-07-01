const express = require('express');

const {
  confirmPayment,
  getPaymentHistory,
  createPaymentUrl,
  vnpayVerify,
  vnpayIpn,
} = require('../controllers/paymentController');

const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// ── VNPay IPN — server-to-server callback (GET & POST, không cần JWT) ───────
router.get('/vnpay_ipn', vnpayIpn);
router.post('/vnpay_ipn', vnpayIpn);

router.get('/vnpay/vnpay_ipn', vnpayIpn);
router.post('/vnpay/vnpay_ipn', vnpayIpn);

router.get('/ipn', vnpayIpn);
router.post('/ipn', vnpayIpn);

router.get('/vnpay/ipn', vnpayIpn);
router.post('/vnpay/ipn', vnpayIpn);

// ── VNPay verify — frontend gọi sau khi VNPay redirect về, không cần JWT ─────
router.post('/vnpay/verify', vnpayVerify);

// ── Các route yêu cầu đăng nhập ─────────────────────────────────────────────
router.use(authenticate);

router.post('/confirm', confirmPayment);
router.post('/vnpay/create_payment_url', createPaymentUrl);
router.get('/:orderId', getPaymentHistory);

module.exports = router;
