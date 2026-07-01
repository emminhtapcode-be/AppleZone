const express = require('express');
const cors    = require('cors');
const path    = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');
require('dotenv').config();

const authRoutes       = require('./routes/auth');
const categoryRoutes   = require('./routes/categories');
const productRoutes    = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payments');
const adminRoutes    = require('./routes/admin');

const app = express();

// ── Middleware toàn cục ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger UI (Tương tự /docs của FastAPI) ──────────────────────────────────
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Static Files (Uploads) ───────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: `${process.env.APP_NAME || 'AppleZone API'} is running 🚀`,
    version: '2.0.0',
    stack:   'Node.js + Express + SQL Server',
  });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products',   productRoutes);
app.use('/api/v1/cart',     cartRoutes);
app.use('/api/v1/orders',   orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin',    adminRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ detail: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ detail: 'Internal server error' });
});

module.exports = app;
