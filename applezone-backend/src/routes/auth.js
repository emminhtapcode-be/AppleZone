const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login',    login);

// @route   GET /api/v1/auth/me
// @desc    Lấy thông tin user hiện tại (Yêu cầu có token hợp lệ)
// @access  Private
router.get('/me', authenticate, me);

// @route   GET /api/v1/auth/make-me-admin
// @desc    Temporary endpoint to grant Admin role
// @access  Private
router.get('/make-me-admin', authenticate, async (req, res) => {
  try {
    const { sql, query } = require('../config/db');
    await query(`UPDATE Users SET ROLE = 'Admin' WHERE USER_ID = @id`, { id: { type: sql.Int, value: req.user.user_id } });
    res.json({ message: 'Bạn đã được nâng cấp lên Admin! Hãy tải lại trang hoặc đăng xuất và đăng nhập lại.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
