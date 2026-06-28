const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/', authenticate, requireRole('Admin'), createCategory);
router.put('/:id', authenticate, requireRole('Admin'), updateCategory);
router.delete('/:id', authenticate, requireRole('Admin'), deleteCategory);

module.exports = router;
