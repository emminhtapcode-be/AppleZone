const express = require('express');
const {
  getProducts,
  getProduct,
  getProductVariants,
  getProductsByCategory,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/category/:catId', getProductsByCategory);
router.get('/:id/variants', getProductVariants);
router.get('/:id', getProduct);

module.exports = router;
