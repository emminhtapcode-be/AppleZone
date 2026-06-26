# 🍎 AppleZone Backend API (Node.js & Express)

Backend cho hệ thống bán lẻ AppleZone/TopZone Mini, được viết lại hoàn toàn bằng **Node.js + Express.js + SQL Server** (dùng Raw T-SQL thuần chay, không ORM).

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

| Method | Endpoint | Mô tả | Auth | Quyền hạn |
|---|---|---|---|---|
| **POST** | `/api/v1/auth/register` | Đăng ký tài khoản | ❌ | Bất kỳ ai |
| **POST** | `/api/v1/auth/login` | Đăng nhập lấy JWT | ❌ | Bất kỳ ai |
| **GET** | `/api/v1/products` | Danh sách sản phẩm | ❌ | Bất kỳ ai |
| **GET** | `/api/v1/products/:id` | Chi tiết sản phẩm + variants | ❌ | Bất kỳ ai |
| **GET** | `/api/v1/cart` | Lấy giỏ hàng hiện tại | ✅ | Customer |
| **POST** | `/api/v1/cart/items` | Thêm/cập nhật sản phẩm vào giỏ | ✅ | Customer |
| **DELETE**| `/api/v1/cart/items/:id`| Xóa sản phẩm khỏi giỏ hàng | ✅ | Customer |
| **POST** | `/api/v1/orders` | Tạo đơn hàng mới (Trừ kho, dùng mã giảm giá) | ✅ | Customer |
| **GET** | `/api/v1/orders` | Danh sách đơn hàng cá nhân | ✅ | Customer |
| **GET** | `/api/v1/orders/:id` | Chi tiết đơn hàng + sản phẩm | ✅ | Customer |
| **POST** | `/api/v1/payments/:orderId`| Thực hiện thanh toán | ✅ | Customer |
| **GET** | `/api/v1/admin/orders` | Xem toàn bộ đơn hàng | ✅ | Admin / Staff |
| **PATCH** | `/api/v1/admin/orders/:id/status`| Cập nhật trạng thái đơn + ghi lịch sử | ✅ | Admin / Staff |

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

### Cách 1: Sử dụng Giao diện Swagger UI (Khuyên dùng)
Khi server đang chạy, truy cập trực tiếp:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Cách 2: Sử dụng REST Client trong VS Code
1. Cài đặt Extension **REST Client** trên VS Code.
2. Mở file `api_test.http` tại root thư mục.
3. Click vào chữ **`Send Request`** ngay phía trên các API để thực thi test trực tiếp.
