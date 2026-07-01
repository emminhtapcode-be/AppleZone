const express = require('express');
const path = require('path');

// Ép buộc hệ thống đi từ thư mục gốc vào đúng file controller xịn
const { 
  confirmPayment,
  getPaymentHistory,
  create_payment_url,
  vnpay_return,
  vnpay_ipn
} = require('../controllers/paymentController');

const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// IPN webhook from VNPay (no auth)
router.get('/vnpay/vnpay_ipn', vnpay_ipn);

// Require auth for other routes
router.use(authenticate);

router.post('/confirm', confirmPayment);
router.get('/:orderId', getPaymentHistory);

router.post('/vnpay/create_payment_url', create_payment_url);
router.get('/vnpay/vnpay_return', vnpay_return);

module.exports = router;