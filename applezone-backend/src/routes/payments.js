const express = require('express');
const path = require('path');

// Ép buộc hệ thống đi từ thư mục gốc vào đúng file controller xịn
const controllerPath = path.join(__dirname, '..', 'controllers', 'paymentController.js');
const { confirmPayment } = require(controllerPath);

const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/confirm', confirmPayment);

module.exports = router;