const express = require('express');
const { getAllOrders, updateOrderStatus } = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

const router = express.Router();

// Tất cả admin routes yêu cầu đăng nhập + role Admin hoặc Staff
router.use(authenticate, requireRole('Admin', 'Staff'));

router.get('/orders',             getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
