const express = require('express');
const { createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const {
  getRevenueReport,
  getBestSellingProducts,
  getLowStockVariants,
  getInventory,
  updateInventory
} = require('../controllers/adminController');

const { authenticate } = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

const router = express.Router();

// Tất cả admin routes yêu cầu đăng nhập + role Admin hoặc Staff
router.use(authenticate, requireRole('Admin', 'Staff'));

// -- Products --
router.post('/products', requireRole('Admin'), createProduct);
router.put('/products/:id', requireRole('Admin'), updateProduct);
router.delete('/products/:id', requireRole('Admin'), deleteProduct);

// -- Orders --
router.get('/orders', getAllOrders);
router.put('/orders/:id', updateOrderStatus);
router.patch('/orders/:id/status', updateOrderStatus);

// -- Reports --
router.get('/reports/revenue', requireRole('Admin'), getRevenueReport);
router.get('/reports/best-selling', requireRole('Admin'), getBestSellingProducts);
router.get('/reports/low-stock', getLowStockVariants); // Staff and Admin

// -- Inventory --
router.get('/inventory', getInventory); // Staff and Admin
router.put('/inventory/:variantId', requireRole('Admin'), updateInventory);

module.exports = router;
