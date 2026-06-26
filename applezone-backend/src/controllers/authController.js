const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, sql } = require('../config/db');
require('dotenv').config();

const SECRET_KEY   = process.env.SECRET_KEY;
const TOKEN_EXPIRE = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES) || 60;

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
async function register(req, res) {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ detail: 'full_name, email và password là bắt buộc' });
    }

    // Kiểm tra email đã tồn tại
    const existing = await query(
      'SELECT user_id FROM users WHERE email = @email',
      { email: { type: sql.NVarChar, value: email } }
    );
    if (existing.recordset.length > 0) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.email,
              INSERTED.phone, INSERTED.role, INSERTED.avatar_url, INSERTED.created_at
       VALUES (@full_name, @email, @phone, @password_hash, 'Customer')`,
      {
        full_name:     { type: sql.NVarChar(100), value: full_name },
        email:         { type: sql.NVarChar(100), value: email },
        phone:         { type: sql.NVarChar(20),  value: phone || null },
        password_hash: { type: sql.NVarChar(255), value: password_hash },
      }
    );

    return res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('[authController.register]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'email và password là bắt buộc' });
    }

    const result = await query(
      `SELECT user_id, full_name, email, phone, password_hash, role, avatar_url, created_at
       FROM users WHERE email = @email`,
      { email: { type: sql.NVarChar, value: email } }
    );

    if (!result.recordset.length) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const user = result.recordset[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { sub: user.user_id, role: user.role },
      SECRET_KEY,
      { expiresIn: `${TOKEN_EXPIRE}m` }
    );

    const { password_hash, ...userSafe } = user;
    return res.json({ access_token: token, token_type: 'bearer', user: userSafe });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
}

module.exports = { register, login };
