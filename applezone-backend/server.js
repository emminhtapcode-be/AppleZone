require('dotenv').config();
const app      = require('./src/app');
const { getPool } = require('./src/config/db');

const PORT = process.env.PORT || 8000;

async function start() {
  try {
    // Kiểm tra kết nối DB trước khi start server
    await getPool();

    app.listen(PORT, () => {
      console.log(`🚀 AppleZone API đang chạy tại http://localhost:${PORT}`);
      console.log(`📋 Stack: Node.js + Express + SQL Server (Raw SQL)`);
      console.log(`🔑 Endpoints:`);
      console.log(`   POST   /api/v1/auth/register`);
      console.log(`   POST   /api/v1/auth/login`);
      console.log(`   GET    /api/v1/products`);
      console.log(`   GET    /api/v1/products/:id`);
      console.log(`   GET    /api/v1/cart              [auth]`);
      console.log(`   POST   /api/v1/cart/items         [auth]`);
      console.log(`   DELETE /api/v1/cart/items/:id     [auth]`);
      console.log(`   POST   /api/v1/orders             [auth]`);
      console.log(`   GET    /api/v1/orders             [auth]`);
      console.log(`   GET    /api/v1/orders/:id         [auth]`);
      console.log(`   POST   /api/v1/payments/:orderId  [auth]`);
      console.log(`   GET    /api/v1/admin/orders        [Admin/Staff]`);
      console.log(`   PATCH  /api/v1/admin/orders/:id/status [Admin/Staff]`);
    });
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err.message);
    process.exit(1);
  }
}

start();
