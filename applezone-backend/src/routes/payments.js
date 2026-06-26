const express = require('express');
const { processPayment } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/:orderId', processPayment);

module.exports = router;
