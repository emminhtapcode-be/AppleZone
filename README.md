# 🍎 AppleZone Backend API (Node.js & Express)

Backend cho hệ thống bán lẻ AppleZone/TopZone Mini, được viết hoàn toàn bằng **Node.js + Express.js + SQL Server** 
## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Web Framework | Express.js |
| Database | Microsoft SQL Server (mssql driver) |
| Query Engine | Raw SQL (parameterized queries) |
| Auth | JWT (jsonwebtoken) |
| Hashing | bcrypt |
| API Testing | Swagger UI |

---

## Cấu trúc thư mục (MVC Pattern)

```
applezone-backend/
├── src/
│   ├── config/
│   │   └── db.js               # Kết nối SQL Server (Connection Pool)
│   ├── middleware/
│   │   ├── authMiddleware.js   # Xác thực JWT
│   │   └── roleMiddleware.js   # Phân quyền (Customer/Staff/Admin)
│   ├── controllers/            # Xử lý Logic (Raw SQL Queries)
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   ├── routes/                 # Định tuyến API
│   │   ├── auth.js / products.js / cart.js
│   │   ├── orders.js / payments.js / admin.js
│   └── app.js                  # Khởi tạo Express, Mount middlewares & routes
├── server.js                   # Entry Point chạy server
├── swagger.json                # Đặc tả OpenAPI / Swagger
├── api_test.http               # File test API trực tiếp trên VS Code
├── .env                        # Biến môi trường
├── package.json
└── README.md
```

---

## API Endpoints & Phân quyền

### 5.4.1 Auth
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| **POST** | `/api/auth/register` | Đăng ký tài khoản khách hàng | Không |
| **POST** | `/api/auth/login` | Đăng nhập, trả về JWT token | Không |
| **GET** | `/api/auth/me` | Lấy thông tin user hiện tại | JWT |

### 5.4.2 Products & Categories
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| **GET** | `/api/categories` | Lấy danh sách danh mục | Không |
| **GET** | `/api/products` | Lấy danh sách sản phẩm (hỗ trợ lọc & phân trang) | Không |
| **GET** | `/api/products/:id` | Chi tiết một sản phẩm | Không |
| **GET** | `/api/products/:id/variants` | Lấy tất cả biến thể của sản phẩm | Không |
| **GET** | `/api/products/category/:catId` | Sản phẩm theo danh mục | Không |
| **POST** | `/api/admin/products` | Tạo sản phẩm mới | Admin |
| **PUT** | `/api/admin/products/:id` | Cập nhật sản phẩm | Admin |
| **DELETE** | `/api/admin/products/:id` | Xóa sản phẩm | Admin |

### 5.4.3 Cart
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| **GET** | `/api/cart` | Lấy giỏ hàng của user hiện tại | JWT |
| **POST** | `/api/cart/add` | Thêm biến thể vào giỏ hàng | JWT |
| **PUT** | `/api/cart/items/:itemId` | Cập nhật số lượng một mục trong giỏ | JWT |
| **DELETE** | `/api/cart/items/:itemId` | Xóa một mục khỏi giỏ hàng | JWT |
| **DELETE** | `/api/cart/clear` | Xóa toàn bộ giỏ hàng | JWT |

### 5.4.4 Orders
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| **POST** | `/api/orders` | Tạo đơn hàng mới (gọi sp_CreateOrder) | JWT |
| **GET** | `/api/orders` | Lấy danh sách đơn hàng của user | JWT |
| **GET** | `/api/orders/:id` | Chi tiết một đơn hàng | JWT |
| **GET** | `/api/admin/orders` | Lấy tất cả đơn hàng (admin) | Staff/Admin |
| **PUT** | `/api/admin/orders/:id` | Cập nhật trạng thái đơn hàng | Staff/Admin |

### 5.4.5 Payments & Coupons
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| **POST** | `/api/payments/confirm` | Xác nhận thanh toán (gọi sp_ConfirmPayment) | JWT |
| **GET** | `/api/payments/:orderId` | Xem lịch sử thanh toán của đơn | JWT |
| **POST** | `/api/coupons/validate` | Kiểm tra mã giảm giá có hợp lệ không | JWT |
| **GET** | `/api/admin/coupons` | Danh sách mã giảm giá | Admin |
| **POST** | `/api/admin/coupons` | Tạo mã giảm giá mới | Admin |

### 5.4.6 Admin - Báo cáo & Tồn kho
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| **GET** | `/api/admin/reports/revenue` | Doanh thu theo ngày/tháng (từ View) | Admin |
| **GET** | `/api/admin/reports/best-selling` | Sản phẩm bán chạy (từ View) | Admin |
| **GET** | `/api/admin/reports/low-stock` | Sản phẩm sắp hết hàng (từ View) | Admin |
| **GET** | `/api/admin/inventory` | Tổng quan tồn kho theo variant | Staff/Admin |
| **PUT** | `/api/admin/inventory/:variantId` | Cập nhật tồn kho thủ công | Admin |
| **GET** | `/api/warranties` | Danh sách bảo hành của user | JWT |

---

## Cài đặt & Khởi chạy

### 1. Cài đặt các Package
Chạy lệnh sau tại root folder của backend để cài đặt các node modules:
```bash
npm install
```

### 2. Cấu hình Biến môi trường (`.env`)
Tạo file `.env` (hoặc sửa file hiện có) với thông số kết nối SQL Server của bạn:
```env
PORT=8000
DB_SERVER=127.0.0.1
DB_PORT=1433
DB_NAME=AppleZone
DB_USER=sa
DB_PASSWORD=Mật_khẩu_của_bạn

SECRET_KEY=78bdea10e5fb6ee7546b765be9fc1990599f12ad0cc5310f5101ca18806434ad
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Chạy ứng dụng

- Chạy chế độ **Development** (tự động reload khi sửa file):
  ```bash
  npm run dev
  ```
- Chạy chế độ **Production**:
  ```bash
  npm start
  ```

---

## Cách Test API

###  Sử dụng Giao diện Swagger UI (Khuyên dùng)
Khi server đang chạy, truy cập trực tiếp:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**
