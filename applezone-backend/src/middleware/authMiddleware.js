const jwt = require('jsonwebtoken');
const { query, sql } = require('../config/db');
require('dotenv').config();

/**
 * Xác thực JWT từ header: Authorization: Bearer <token>
 * Gắn req.user nếu hợp lệ
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ detail: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.SECRET_KEY);

    const result = await query(
      `SELECT USER_ID AS user_id, full_name, email, phone, ROLE AS role
       FROM Users WHERE USER_ID = @id`,
      { id: { type: sql.Int, value: payload.sub } }
    );

    if (!result.recordset.length) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = result.recordset[0];
    next();
  } catch (err) {
    console.error('[authMiddleware] Auth error:', err);
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
