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
      `SELECT user_id, full_name, email, phone, role, avatar_url
       FROM users WHERE user_id = @id`,
      { id: { type: sql.Int, value: payload.sub } }
    );

    if (!result.recordset.length) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = result.recordset[0];
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
