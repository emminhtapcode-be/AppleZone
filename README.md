# 🍎 AppleZone Backend API

Backend cho hệ thống bán lẻ AppleZone/TopZone Mini, xây dựng bằng **FastAPI + SQL Server**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+ / FastAPI |
| Database | Microsoft SQL Server |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose) |
| Password | bcrypt (passlib) |

## Cấu trúc thư mục

```
applezone-backend/
├── app/
│   ├── api/routes/        # Endpoints: auth, products, cart, orders, payments, admin
│   ├── core/              # Config, security (JWT, bcrypt)
│   ├── db/                # Kết nối SQL Server (SQLAlchemy)
│   ├── middleware/        # Auth middleware, role checker
│   ├── models/            # SQLAlchemy ORM models
│   ├── schemas/           # Pydantic request/response schemas
│   ├── services/          # Business logic
│   └── main.py            # Entry point, CORS, router mount
├── tests/
├── .env.example
├── requirements.txt
└── README.md
```

## API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/v1/auth/register` | Đăng ký | ❌ |
| POST | `/api/v1/auth/login` | Đăng nhập → JWT | ❌ |
| GET | `/api/v1/products/` | Danh sách sản phẩm | ❌ |
| GET | `/api/v1/products/{id}` | Chi tiết sản phẩm | ❌ |
| GET | `/api/v1/cart/` | Xem giỏ hàng | ✅ Customer |
| POST | `/api/v1/cart/items` | Thêm vào giỏ | ✅ Customer |
| POST | `/api/v1/orders/` | Tạo đơn hàng | ✅ Customer |
| GET | `/api/v1/orders/` | Đơn hàng của tôi | ✅ Customer |
| POST | `/api/v1/payments/{order_id}` | Thanh toán | ✅ Customer |
| GET | `/api/v1/admin/orders` | Quản lý đơn | ✅ Admin/Staff |

## Cài đặt & Chạy

### 1. Clone repo
```bash
git clone https://github.com/your-username/applezone-backend.git
cd applezone-backend
```

### 2. Tạo virtual environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Cài dependencies
```bash
pip install -r requirements.txt
```

### 4. Cấu hình .env
```bash
cp .env.example .env
# Sửa thông tin DB và SECRET_KEY trong .env
```

### 5. Chạy ứng dụng
```bash
uvicorn app.main:app --reload --port 8000
```

### 6. Truy cập Swagger Docs
```
http://localhost:8000/docs
```

## Phân quyền

| Role | Quyền |
|------|-------|
| Customer | Xem sản phẩm, giỏ hàng, đặt hàng, thanh toán |
| Staff | + Quản lý đơn hàng |
| Admin | + Toàn quyền |
