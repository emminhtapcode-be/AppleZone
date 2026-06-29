const express = require('express');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

const router = express.Router();

// Tất cả admin routes yêu cầu đăng nhập + role Admin hoặc Staff
router.use(authenticate, requireRole('Admin', 'Staff'));

router.post('/products', requireRole('Admin'), createProduct);
router.put('/products/:id', requireRole('Admin'), updateProduct);
router.delete('/products/:id', requireRole('Admin'), deleteProduct);

router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrderStatus);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
