const express = require('express');
const { getCart, addToCart, removeCartItem } = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/',          getCart);
router.post('/items',    addToCart);
router.delete('/items/:id', removeCartItem);

module.exports = router;
