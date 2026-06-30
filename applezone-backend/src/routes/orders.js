const express = require('express');
const { createOrder, getMyOrders, getOrder, cancelOrder } = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/',    createOrder);
router.get('/',     getMyOrders);
router.get('/:id',  getOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
