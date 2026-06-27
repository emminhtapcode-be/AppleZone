require('dotenv').config();
const app = require('./src/app');
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
      console.log(`   POST   /api/auth/register`);
      console.log(`   POST   /api/auth/login`);
      console.log(`   GET    /api/auth/me                              [auth]`);
      console.log(`   GET    /api/categories`);
      console.log(`   GET    /api/categories/:id`);
      console.log(`   POST   /api/categories                           [admin]`);
      console.log(`   PUT    /api/categories/:id                       [admin]`);
      console.log(`   DELETE /api/categories/:id                       [admin]`);
      console.log(`   GET    /api/products`);
      console.log(`   GET    /api/products/:id`);
      console.log(`   GET    /api/products/:id/variants`);
      console.log(`   GET    /api/products/category/:catId`);
      console.log('   POST   /api/admin/products                       [admin]');
      console.log('   PUT    /api/admin/products/:id                   [admin]');
      console.log('   DELETE /api/admin/products/:id                   [admin]');
      console.log(`   GET    /api/cart                                 [auth]`);
      console.log(`   POST   /api/cart/add                             [auth]`);
      console.log(`   PUT    /api/cart/items/:id                       [auth]`);
      console.log(`   DELETE /api/cart/items/:id                       [auth]`);
      console.log(`   DELETE /api/cart/clear                           [auth]`);
      console.log(`   POST   /api/orders                               [auth]`);
      console.log(`   GET    /api/orders                               [auth]`);
      console.log(`   GET    /api/orders/:id                           [auth]`);
      console.log(`   GET    /api/admin/orders                         [Admin/Staff]`);
      console.log(`   PUT    /api/admin/orders/:id                     [Admin/Staff]`);
      console.log(`   POST   /api/payments/confirm                     [auth]`);
      console.log(`   GET    /api/payments/:orderId                    [auth]`);
      console.log(`   POST   /api/coupons/validate                     [auth]`);
      console.log(`   GET    /api/admin/coupons                        [admin]`);
      console.log(`   POST   /api/admin/coupons                        [admin]`);
      console.log('   GET    /api/admin/reports/revenue                [Admin]');
      console.log('   GET    /api/admin/reports/best-selling           [Admin]');
      console.log('   GET    /api/admin/reports/low-stock              [Admin]');
      console.log('   GET    /api/admin/inventory                      [Admin]');
      console.log('   PUT    /api/admin/inventory/:variantId           [Admin]');
      console.log('   GET    /api/warranties                           [auth]');
      console.log('   POST   /api/warranties/extend                    [auth]');
      console.log('   GET    /api/warranties/me                        [auth]');
    });
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err.message);
    process.exit(1);
  }
}

start();
