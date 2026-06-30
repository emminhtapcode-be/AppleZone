# AppleZone E-commerce System — Tài liệu Đặc tả Tính năng (Feature Specification)

> **Phiên bản:** v3.0 (bổ sung từ bản báo cáo DBMS v2)
> **Loại tài liệu:** Functional & Technical Specification
> **Phạm vi:** Mô hình dữ liệu, kiến trúc, API, luồng nghiệp vụ, trạng thái hệ thống, bảo mật, yêu cầu phi chức năng.

---

## Mục lục

1. [Giới thiệu chung](#1-giới-thiệu-chung)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Mô hình dữ liệu (ERD & Schema chi tiết)](#3-mô-hình-dữ-liệu-erd--schema-chi-tiết)
4. [Đặc tả chức năng theo module](#4-đặc-tả-chức-năng-theo-module)
5. [Trạng thái hệ thống (State Machines)](#5-trạng-thái-hệ-thống-state-machines)
6. [Đặc tả API chi tiết](#6-đặc-tả-api-chi-tiết)
7. [Backend — Cấu trúc & Logic](#7-backend--cấu-trúc--logic)
8. [DBMS Showcase — Transaction, Concurrency, Deadlock](#8-dbms-showcase--transaction-concurrency-deadlock)
9. [Index, View & Tối ưu truy vấn](#9-index-view--tối-ưu-truy-vấn)
10. [Phân quyền & Bảo mật](#10-phân-quyền--bảo-mật)
11. [Giao diện người dùng](#11-giao-diện-người-dùng)
12. [Yêu cầu phi chức năng (Non-Functional Requirements)](#12-yêu-cầu-phi-chức-năng-non-functional-requirements)
13. [Kế hoạch triển khai & Phân công](#13-kế-hoạch-triển-khai--phân-công)
14. [Rủi ro & Hướng phát triển](#14-rủi-ro--hướng-phát-triển)

---

## 1. Giới thiệu chung

### 1.1 Mục tiêu dự án

AppleZone là hệ thống bán hàng online mô phỏng mô hình **Apple Authorized Reseller** (tương tự TopZone, CellphoneS), phục vụ mục tiêu học thuật: minh họa toàn diện các khái niệm của môn **Hệ Quản Trị Cơ Sở Dữ Liệu (DBMS)** trong một ứng dụng thực tế có backend REST API.

Đối tượng sản phẩm kinh doanh: **iPhone, iPad, MacBook, Apple Watch, AirPods và phụ kiện.**

### 1.2 Đối tượng người dùng (Actors)

| Actor | Mô tả |
|---|---|
| **Khách (Guest)** | Chưa đăng nhập — chỉ xem sản phẩm, danh mục. |
| **Customer** | Đã đăng ký — mua hàng, quản lý giỏ, theo dõi đơn, kích hoạt bảo hành. |
| **Staff** | Nhân viên — xử lý đơn hàng, xác nhận thanh toán, xem tồn kho. |
| **Admin** | Toàn quyền — quản lý sản phẩm, người dùng, khuyến mãi, báo cáo. |

### 1.3 Phạm vi tài liệu

Tài liệu này **mở rộng bản báo cáo gốc (v2)** bằng cách bổ sung:
- ERD đầy đủ kiểu dữ liệu, ràng buộc, cardinality ký hiệu chuẩn.
- Đặc tả luồng nghiệp vụ (business flow) dạng các bước tuần tự cho từng chức năng.
- State machine (vòng đời trạng thái) cho Order, Payment, Warranty, Coupon.
- Validation rules và bảng mã lỗi (error codes) cho từng API.
- Request/Response mẫu (JSON) cho các endpoint chính.
- Acceptance criteria cho từng module.
- Yêu cầu phi chức năng: hiệu năng, bảo mật, khả năng mở rộng.

---

## 2. Kiến trúc hệ thống

### 2.1 Kiến trúc tổng thể (3-tier)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│   Web Frontend (HTML/CSS/JS hoặc React) — mô phỏng giao diện     │
│   TopZone: Trang chủ, Danh sách SP, Chi tiết SP, Giỏ hàng,       │
│   Checkout, Admin Dashboard                                      │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS / REST (JSON)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│   Node.js + Express.js                                           │
│   ┌───────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│   │ Middleware │→│  Controllers │→│  (gọi Stored Procedure)  │  │
│   │ (JWT, Role)│  │ (business)   │  │                          │  │
│   └───────────┘  └──────────────┘  └─────────────────────────┘  │
│   Auth: JWT + bcrypt        Validation: Joi                      │
└───────────────────────────────┬───────────────────────────────────┘
                                 │ mssql (tedious driver) — Connection Pool
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                 │
│   Microsoft SQL Server                                            │
│   • 11 bảng (3NF)            • Stored Procedures (sp_CreateOrder, │
│   • Triggers (cập nhật trạng    sp_ConfirmPayment)                │
│     thái đơn tự động)        • Views (báo cáo doanh thu,          │
│   • Indexes (tối ưu truy vấn)   bán chạy, sắp hết hàng)           │
│   • Role-based permissions    • Transaction & Locking             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Bảng công nghệ

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| Database | SQL Server | Lưu trữ dữ liệu, Stored Procedure, Trigger, View, phân quyền |
| Backend | Node.js + Express.js | REST API, xử lý business logic, gọi SP |
| ORM/Driver | mssql (tedious) | Kết nối Node.js ↔ SQL Server |
| Auth | JWT + bcrypt | Xác thực người dùng, mã hóa mật khẩu |
| Validation | Joi | Kiểm tra dữ liệu đầu vào request |
| Frontend | HTML/CSS/JS (hoặc React) | Giao diện người dùng, gọi REST API |

### 2.3 Luồng request điển hình (Sequence tổng quát)

```
Client → POST /api/orders (JWT token)
   │
   ▼
authMiddleware  → giải mã & xác thực JWT
   │
   ▼
Joi validation  → kiểm tra variant_id, quantity hợp lệ
   │
   ▼
orderController.createOrder()
   │
   ▼
pool.request().execute('sp_CreateOrder')  ──▶ SQL Server
                                                  │
                                BEGIN TRANSACTION │
                                Trừ stock (kiểm tra @@ROWCOUNT)
                                Insert Orders, OrderItems
                                COMMIT / ROLLBACK
                                                  │
   ◀──────────────────────────────────────────────┘
   ▼
Response JSON (201 Created / 400 Lỗi tồn kho)
```

### 2.4 Điểm nhấn DBMS

| Nội dung | Mô tả |
|---|---|
| Thiết kế CSDL | Sản phẩm có nhiều biến thể màu/dung lượng/SKU (bảng `ProductVariants`), chuẩn hóa 3NF. |
| Transaction | Đặt hàng nguyên tử: `Order + OrderItems + trừ stock + Payment` trong 1 transaction. |
| Concurrency | Pessimistic locking (kiểm tra `@@ROWCOUNT` sau `UPDATE`) tránh overselling khi nhiều khách mua cùng lúc. |
| Deadlock | Demo vòng chờ giữa hai session trên `Orders` và `ProductVariants`. |
| Trigger/SP | Trigger tự cập nhật trạng thái đơn; SP đóng gói quy trình đặt hàng/thanh toán. |
| Index/View | Tối ưu truy vấn; View báo cáo doanh thu, sản phẩm bán chạy, sắp hết hàng. |
| Role/Permission | `Customer`, `Staff`, `Admin` với quyền SQL Server khác nhau (least-privilege). |

---

## 3. Mô hình dữ liệu (ERD & Schema chi tiết)

### 3.1 Sơ đồ ERD (ký hiệu Crow's Foot)

```
Categories ───1───────n─── Products ───1───────n─── ProductVariants
   (category_id PK)           (product_id PK)            (variant_id PK)
                                                              │
                                                              │1
                                                              │
                                                              n
Users ───1───n─── Orders ───1───n─── OrderItems ────────────┘
(user_id PK)      (order_id PK)      (order_item_id PK)
   │                  │  │                 │1
   │1                 │  │1                │
   n                   │  n                 1
 Carts            Coupons  Payments      Warranties
(cart_id PK)     (coupon_id PK)(payment_id PK)(warranty_id PK)
   │1
   │
   n
CartItems ──n──1── ProductVariants
(cart_item_id PK)
```

**Diễn giải cardinality:**

| Quan hệ | Bản số | Giải thích |
|---|---|---|
| Categories → Products | 1–n | Một danh mục có nhiều sản phẩm |
| Products → ProductVariants | 1–n | Một sản phẩm có nhiều biến thể màu/dung lượng |
| Users → Carts | 1–1 (logic) | Mỗi user có một giỏ hàng hiện hành |
| Carts → CartItems | 1–n | Một giỏ hàng có nhiều dòng sản phẩm |
| ProductVariants → CartItems | 1–n | Một biến thể có thể nằm trong nhiều giỏ |
| Users → Orders | 1–n | Một khách hàng có nhiều đơn hàng |
| Orders → OrderItems | 1–n | Một đơn hàng có nhiều dòng sản phẩm |
| ProductVariants → OrderItems | 1–n | Một biến thể xuất hiện trong nhiều đơn hàng |
| Coupons → Orders | 1–n (optional) | Một mã giảm giá có thể dùng cho nhiều đơn |
| Orders → Payments | 1–n | Một đơn hàng có thể có nhiều lần thanh toán (retry) |
| OrderItems → Warranties | 1–1 | Mỗi sản phẩm đã mua có một bảo hành |

### 3.2 Danh sách bảng (đầy đủ kiểu dữ liệu & ràng buộc)

#### 3.2.1 `Users`

| Cột | Kiểu dữ liệu | Ràng buộc | Ghi chú |
|---|---|---|---|
| user_id | INT | PK, IDENTITY(1,1) | |
| full_name | NVARCHAR(100) | NOT NULL | |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Dùng để đăng nhập |
| phone | VARCHAR(15) | NULL | |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| role | VARCHAR(20) | NOT NULL, CHECK (role IN ('customer','staff','admin')), DEFAULT 'customer' | |
| created_at | DATETIME | DEFAULT GETDATE() | |

#### 3.2.2 `Categories`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| category_id | INT | PK, IDENTITY(1,1) |
| category_name | NVARCHAR(50) | NOT NULL |
| slug | VARCHAR(50) | UNIQUE NOT NULL |
| status | BIT | DEFAULT 1 |

#### 3.2.3 `Products`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| product_id | INT | PK, IDENTITY(1,1) |
| category_id | INT | FK → Categories.category_id, NOT NULL |
| product_name | NVARCHAR(150) | NOT NULL |
| description | NVARCHAR(MAX) | NULL |
| base_price | DECIMAL(18,2) | NOT NULL, CHECK (base_price >= 0) |
| status | VARCHAR(20) | CHECK (status IN ('active','hidden','discontinued')), DEFAULT 'active' |

#### 3.2.4 `ProductVariants`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| variant_id | INT | PK, IDENTITY(1,1) |
| product_id | INT | FK → Products.product_id, NOT NULL |
| color | NVARCHAR(50) | NOT NULL |
| storage | NVARCHAR(20) | NOT NULL |
| sku | VARCHAR(50) | UNIQUE NOT NULL |
| price | DECIMAL(18,2) | NOT NULL, CHECK (price >= 0) |
| stock_quantity | INT | NOT NULL, CHECK (stock_quantity >= 0), DEFAULT 0 |
| status | VARCHAR(20) | CHECK (status IN ('available','out_of_stock')), DEFAULT 'available' |

> UNIQUE constraint bổ sung: `(product_id, color, storage)` — tránh trùng biến thể.

#### 3.2.5 `Carts`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| cart_id | INT | PK, IDENTITY(1,1) |
| user_id | INT | FK → Users.user_id, NOT NULL, UNIQUE |
| created_at | DATETIME | DEFAULT GETDATE() |

#### 3.2.6 `CartItems`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| cart_item_id | INT | PK, IDENTITY(1,1) |
| cart_id | INT | FK → Carts.cart_id, NOT NULL |
| variant_id | INT | FK → ProductVariants.variant_id, NOT NULL |
| quantity | INT | NOT NULL, CHECK (quantity > 0), DEFAULT 1 |

> UNIQUE constraint: `(cart_id, variant_id)` — mỗi biến thể chỉ xuất hiện 1 dòng/giỏ.

#### 3.2.7 `Orders`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| order_id | INT | PK, IDENTITY(1,1) |
| user_id | INT | FK → Users.user_id, NOT NULL |
| coupon_id | INT | FK → Coupons.coupon_id, NULL |
| total_amount | DECIMAL(18,2) | NOT NULL, CHECK (total_amount >= 0) |
| discount_amount | DECIMAL(18,2) | DEFAULT 0, CHECK (discount_amount >= 0) |
| final_amount | DECIMAL(18,2) | NOT NULL, CHECK (final_amount >= 0) |
| order_status | VARCHAR(20) | CHECK (order_status IN ('Pending','Confirmed','Processing','Shipped','Delivered','Cancelled')), DEFAULT 'Pending' |
| payment_status | VARCHAR(20) | CHECK (payment_status IN ('Unpaid','Paid','Refunded','Failed')), DEFAULT 'Unpaid' |
| created_at | DATETIME | DEFAULT GETDATE() |

#### 3.2.8 `OrderItems`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| order_item_id | INT | PK, IDENTITY(1,1) |
| order_id | INT | FK → Orders.order_id, NOT NULL |
| variant_id | INT | FK → ProductVariants.variant_id, NOT NULL |
| quantity | INT | NOT NULL, CHECK (quantity > 0) |
| unit_price | DECIMAL(18,2) | NOT NULL, CHECK (unit_price >= 0) |

#### 3.2.9 `Payments`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| payment_id | INT | PK, IDENTITY(1,1) |
| order_id | INT | FK → Orders.order_id, NOT NULL |
| payment_method | VARCHAR(30) | CHECK (payment_method IN ('COD','BankTransfer','EWallet','Installment')) |
| amount | DECIMAL(18,2) | NOT NULL, CHECK (amount >= 0) |
| payment_status | VARCHAR(20) | CHECK (payment_status IN ('Pending','Paid','Failed')), DEFAULT 'Pending' |
| paid_at | DATETIME | NULL |

#### 3.2.10 `Coupons`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| coupon_id | INT | PK, IDENTITY(1,1) |
| code | VARCHAR(30) | UNIQUE NOT NULL |
| discount_type | VARCHAR(10) | CHECK (discount_type IN ('percent','amount')) |
| discount_value | DECIMAL(18,2) | NOT NULL, CHECK (discount_value > 0) |
| min_order_amount | DECIMAL(18,2) | DEFAULT 0 |
| start_date | DATETIME | NOT NULL |
| end_date | DATETIME | NOT NULL, CHECK (end_date > start_date) |
| usage_limit | INT | DEFAULT NULL — NULL = không giới hạn |

#### 3.2.11 `Warranties`

| Cột | Kiểu dữ liệu | Ràng buộc |
|---|---|---|
| warranty_id | INT | PK, IDENTITY(1,1) |
| order_item_id | INT | FK → OrderItems.order_item_id, NOT NULL, UNIQUE |
| serial_number | VARCHAR(50) | NOT NULL |
| start_date | DATE | NOT NULL |
| end_date | DATE | NOT NULL, CHECK (end_date > start_date) |
| status | VARCHAR(20) | CHECK (status IN ('Active','Expired','Claimed')), DEFAULT 'Active' |

### 3.3 Ghi chú chuẩn hóa (3NF)

- `ProductVariants` tách biệt khỏi `Products` để tránh lặp lại thông tin chung (tên, mô tả) cho từng màu/dung lượng — loại bỏ transitive dependency.
- `OrderItems` lưu `unit_price` tại thời điểm đặt hàng (snapshot giá) — tránh phụ thuộc vào giá hiện tại của `ProductVariants` có thể thay đổi sau này (tránh vi phạm tính toàn vẹn lịch sử dữ liệu).
- `Warranties` tách riêng khỏi `OrderItems` vì có vòng đời và thuộc tính riêng (serial number, ngày hết hạn) — chuẩn hóa 1–1.

---

## 4. Đặc tả chức năng theo module

### 4.1 Module Khách hàng (Authentication & Account)

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-01 | Đăng ký | Tạo tài khoản với email, mật khẩu, họ tên |
| F-02 | Đăng nhập | Xác thực email/mật khẩu, trả JWT |
| F-03 | Xem thông tin cá nhân | Lấy thông tin user hiện tại từ token |

**Luồng nghiệp vụ — Đăng ký (F-01):**
1. Người dùng nhập `full_name`, `email`, `phone`, `password`.
2. Backend validate định dạng (Joi): email hợp lệ, password ≥ 8 ký tự.
3. Kiểm tra `email` đã tồn tại trong `Users` chưa → nếu có, trả lỗi `409 Conflict`.
4. Hash password bằng `bcrypt` (salt rounds ≥ 10).
5. `INSERT` vào `Users` với `role = 'customer'`.
6. Trả về `201 Created` (không trả password_hash).

**Acceptance Criteria:**
- [ ] Không thể đăng ký trùng email.
- [ ] Mật khẩu không được lưu plaintext.
- [ ] Mặc định role luôn là `customer`, không thể tự đăng ký làm `admin`/`staff`.

### 4.2 Module Sản phẩm

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-10 | Danh sách sản phẩm | Lọc theo danh mục, giá, có phân trang |
| F-11 | Chi tiết sản phẩm | Hiển thị thông tin + danh sách biến thể |
| F-12 | Quản lý sản phẩm (Admin) | CRUD sản phẩm và biến thể |

**Luồng nghiệp vụ — Xem chi tiết & chọn biến thể (F-11):**
1. Khách chọn sản phẩm → gọi `GET /api/products/:id`.
2. Gọi tiếp `GET /api/products/:id/variants` để lấy danh sách màu/dung lượng còn hàng.
3. Frontend hiển thị các tổ hợp màu/dung lượng; biến thể có `stock_quantity = 0` hiển thị "Hết hàng" và disable nút thêm vào giỏ.

**Quy tắc nghiệp vụ:**
- Sản phẩm có `status = 'hidden'` hoặc `'discontinued'` không hiển thị cho khách (Guest/Customer) nhưng Admin vẫn xem được.
- Giá hiển thị luôn lấy từ `ProductVariants.price`, không phải `Products.base_price` (base_price chỉ là giá tham khảo/giá thấp nhất hiển thị ở danh sách).

### 4.3 Module Giỏ hàng

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-20 | Thêm vào giỏ | Thêm biến thể + số lượng |
| F-21 | Cập nhật số lượng | Tăng/giảm số lượng một dòng trong giỏ |
| F-22 | Xóa khỏi giỏ | Xóa một dòng hoặc xóa toàn bộ giỏ |
| F-23 | Tính tổng tiền | Tính tổng trước khi đặt hàng (chưa trừ kho) |

**Luồng nghiệp vụ — Thêm vào giỏ (F-20):**
1. Customer chọn variant + quantity → `POST /api/cart/add`.
2. Backend kiểm tra `variant_id` tồn tại và `status = 'available'`.
3. Nếu variant đã có trong giỏ (`cart_id`, `variant_id` trùng) → `UPDATE` tăng `quantity` (upsert), ngược lại `INSERT` dòng mới.
4. **Lưu ý:** việc thêm vào giỏ **không trừ tồn kho** — tồn kho chỉ bị trừ khi tạo `Order` thực sự (tại bước `sp_CreateOrder`), nhằm tránh giữ kho "ảo" khi khách bỏ giỏ hàng.

**Validation:**
- `quantity` phải > 0 và ≤ `stock_quantity` hiện tại tại thời điểm hiển thị (soft check, không khóa kho).

### 4.4 Module Đơn hàng & Thanh toán

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-30 | Tạo đơn hàng | Atomic transaction: tạo Order + OrderItems + trừ kho |
| F-31 | Áp dụng mã giảm giá | Kiểm tra điều kiện & tính discount_amount |
| F-32 | Xác nhận thanh toán | Cập nhật Payment → Trigger tự chuyển Order |
| F-33 | Theo dõi đơn hàng | Customer xem trạng thái đơn của mình |
| F-34 | Quản lý đơn (Staff/Admin) | Cập nhật trạng thái xử lý/giao hàng |

**Luồng nghiệp vụ — Đặt hàng & Thanh toán (F-30 → F-32), end-to-end:**

```
1. Customer bấm "Đặt hàng" từ giỏ hàng (có thể kèm coupon code)
       │
       ▼
2. POST /api/coupons/validate (nếu có coupon) → kiểm tra hạn dùng, usage_limit, min_order_amount
       │
       ▼
3. POST /api/orders { variant_id, quantity, coupon_id? }
       │
       ▼
4. Backend gọi sp_CreateOrder (xem mục 8) — TRONG 1 TRANSACTION:
   a. Khóa & kiểm tra stock_quantity ≥ quantity (pessimistic lock)
   b. Nếu không đủ → ROLLBACK, trả lỗi 400 "Sản phẩm đã hết hàng"
   c. Trừ stock_quantity
   d. Tính total_amount, discount_amount (nếu có coupon), final_amount
   e. INSERT Orders (order_status='Pending', payment_status='Unpaid')
   f. INSERT OrderItems (snapshot unit_price)
   g. INSERT Payments (payment_status='Pending')
   h. COMMIT
       │
       ▼
5. Response 201 { order_id, final_amount, order_status: 'Pending' }
       │
       ▼
6. Customer thực hiện thanh toán (giả lập) → POST /api/payments/confirm { order_id }
       │
       ▼
7. Backend gọi sp_ConfirmPayment → UPDATE Payments SET payment_status='Paid', paid_at=GETDATE()
       │
       ▼
8. TRIGGER trg_UpdateOrderAfterPayment tự động kích hoạt:
   UPDATE Orders SET payment_status='Paid', order_status='Confirmed'
       │
       ▼
9. (Đề xuất bổ sung) TRIGGER/SP tự tạo Warranties cho từng OrderItem khi Order chuyển 'Confirmed'
       │
       ▼
10. Response 200 { message: "Xác nhận thanh toán thành công" }
```

**Quy tắc nghiệp vụ quan trọng:**
- Việc trừ kho xảy ra **ngay khi tạo Order** (giữ hàng tạm), không chờ thanh toán xong — mô phỏng hành vi giữ chỗ phổ biến của các sàn TMĐT.
- Nếu Order bị `Cancelled` trước khi `Confirmed`, cần hoàn trả `stock_quantity` (cộng lại) — **đây là một chức năng cần bổ sung**, hiện tài liệu gốc chưa đặc tả rollback tồn kho khi hủy đơn.
- `final_amount = total_amount - discount_amount`, không được âm (ràng buộc CHECK).

**Mã lỗi (Error Codes) — Module Order:**

| Mã lỗi SQL | HTTP Status | Ý nghĩa |
|---|---|---|
| 50001 | 400 | Sản phẩm đã hết hàng / không đủ tồn kho |
| 50002 | 400 | Không đủ tồn kho để đặt hàng (concurrency check) |
| 50003 (đề xuất) | 400 | Mã giảm giá không hợp lệ hoặc đã hết hạn |
| 50004 (đề xuất) | 409 | Đơn hàng đã được thanh toán, không thể xác nhận lại |
| — | 401 | Chưa đăng nhập / token không hợp lệ |
| — | 403 | Không có quyền truy cập (sai role) |
| — | 404 | Không tìm thấy order_id |

### 4.5 Module Khuyến mãi

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-40 | Tạo mã giảm giá (Admin) | Thiết lập % hoặc số tiền cố định, thời hạn, giới hạn dùng |
| F-41 | Kiểm tra mã giảm giá | Validate trước khi áp dụng vào đơn hàng |

**Quy tắc kiểm tra coupon (F-41):**
1. `code` tồn tại trong `Coupons`.
2. `GETDATE()` nằm trong khoảng `[start_date, end_date]`.
3. Tổng giá trị đơn hàng ≥ `min_order_amount`.
4. Số lần đã sử dụng < `usage_limit` (nếu có giới hạn) — **cần bảng phụ hoặc cột đếm `used_count` để theo dõi, hiện schema gốc chưa có cột này — đề xuất bổ sung `Coupons.used_count INT DEFAULT 0`.**

### 4.6 Module Bảo hành

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-50 | Tự động tạo bảo hành | Sau khi Order chuyển `Confirmed`, tạo Warranty cho mỗi OrderItem |
| F-51 | Xem bảo hành | Customer xem danh sách bảo hành của mình |
| F-52 | Cập nhật trạng thái bảo hành | Hệ thống tự đánh `Expired` khi quá `end_date` (qua job định kỳ hoặc tính toán động) |

**Quy tắc:** `end_date = start_date + 12 tháng` (mặc định, có thể cấu hình theo loại sản phẩm).

### 4.7 Module Admin

| Mã | Chức năng | Mô tả |
|---|---|---|
| F-60 | Quản lý sản phẩm | CRUD Products & ProductVariants |
| F-61 | Quản lý đơn hàng | Xem tất cả đơn, cập nhật trạng thái |
| F-62 | Quản lý tồn kho | Xem/điều chỉnh `stock_quantity` thủ công |
| F-63 | Báo cáo doanh thu | Doanh thu theo ngày/tháng (từ View) |
| F-64 | Báo cáo bán chạy / sắp hết hàng | Top sản phẩm, cảnh báo tồn kho thấp |
| F-65 | Quản lý khách hàng | Xem danh sách user, khóa/mở tài khoản |

---

## 5. Trạng thái hệ thống (State Machines)

### 5.1 Vòng đời Order (`order_status`)

```
Pending ──(thanh toán thành công, trigger)──▶ Confirmed
   │                                              │
   │ (hủy bởi customer/staff)                     │ (staff xử lý)
   ▼                                              ▼
Cancelled                                    Processing
                                                   │
                                                   ▼
                                                Shipped
                                                   │
                                                   ▼
                                                Delivered
```

| Trạng thái | Ý nghĩa | Có thể chuyển sang |
|---|---|---|
| `Pending` | Đơn vừa tạo, chưa thanh toán | `Confirmed`, `Cancelled` |
| `Confirmed` | Đã thanh toán (trigger tự cập nhật) | `Processing`, `Cancelled` |
| `Processing` | Staff đang chuẩn bị hàng | `Shipped` |
| `Shipped` | Đang giao hàng | `Delivered` |
| `Delivered` | Hoàn tất | (kết thúc) |
| `Cancelled` | Đã hủy | (kết thúc; **cần hoàn kho**) |

### 5.2 Vòng đời Payment (`payment_status`)

```
Pending ──(xác nhận thành công)──▶ Paid
   │
   └──(timeout / từ chối)──▶ Failed
```

### 5.3 Vòng đời Warranty (`status`)

```
Active ──(quá end_date)──▶ Expired
   │
   └──(khách yêu cầu bảo hành)──▶ Claimed
```

### 5.4 Lưu ý thiết kế còn thiếu trong bản gốc

- **Hoàn kho khi hủy đơn:** chưa có Trigger/SP xử lý cộng lại `stock_quantity` khi `order_status` chuyển sang `Cancelled`. Đề xuất: Trigger `AFTER UPDATE` trên `Orders`, nếu `order_status` mới = `'Cancelled'` và cũ ≠ `'Cancelled'` → cộng lại `quantity` từ `OrderItems` tương ứng vào `ProductVariants.stock_quantity`.
- **Idempotency khi xác nhận thanh toán:** cần kiểm tra `payment_status` hiện tại trước khi cho phép `sp_ConfirmPayment` chạy lại (tránh xác nhận trùng) → mã lỗi `50004` đề xuất ở mục 4.4.

---

## 6. Đặc tả API chi tiết

### 6.1 Auth

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản khách hàng | Không |
| POST | `/api/auth/login` | Đăng nhập, trả về JWT token | Không |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại | JWT |

**Ví dụ — `POST /api/auth/login`**

Request:
```json
{ "email": "khachhang@gmail.com", "password": "matkhau123" }
```

Response `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "user_id": 1, "full_name": "Nguyễn Văn A", "role": "customer" }
}
```

Response `401 Unauthorized`:
```json
{ "message": "Email hoặc mật khẩu không đúng" }
```

### 6.2 Products & Categories

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/categories` | Lấy danh sách danh mục | Không |
| GET | `/api/products` | Lấy danh sách sản phẩm (lọc & phân trang) | Không |
| GET | `/api/products/:id` | Chi tiết một sản phẩm | Không |
| GET | `/api/products/:id/variants` | Lấy tất cả biến thể của sản phẩm | Không |
| GET | `/api/products/category/:catId` | Sản phẩm theo danh mục | Không |
| POST | `/api/admin/products` | Tạo sản phẩm mới | Admin |
| PUT | `/api/admin/products/:id` | Cập nhật sản phẩm | Admin |
| DELETE | `/api/admin/products/:id` | Xóa sản phẩm | Admin |

**Query params đề xuất cho `GET /api/products`:**

| Param | Kiểu | Mô tả |
|---|---|---|
| category | int | Lọc theo category_id |
| minPrice / maxPrice | decimal | Lọc theo khoảng giá |
| page / limit | int | Phân trang (mặc định page=1, limit=20) |
| sort | string | `price_asc`, `price_desc`, `newest` |

### 6.3 Cart

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/cart` | Lấy giỏ hàng của user hiện tại | JWT |
| POST | `/api/cart/add` | Thêm biến thể vào giỏ hàng | JWT |
| PUT | `/api/cart/items/:itemId` | Cập nhật số lượng một mục trong giỏ | JWT |
| DELETE | `/api/cart/items/:itemId` | Xóa một mục khỏi giỏ hàng | JWT |
| DELETE | `/api/cart/clear` | Xóa toàn bộ giỏ hàng | JWT |

### 6.4 Orders

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/orders` | Tạo đơn hàng mới (gọi sp_CreateOrder) | JWT |
| GET | `/api/orders` | Lấy danh sách đơn hàng của user | JWT |
| GET | `/api/orders/:id` | Chi tiết một đơn hàng | JWT |
| GET | `/api/admin/orders` | Lấy tất cả đơn hàng (admin) | Staff/Admin |
| PUT | `/api/admin/orders/:id` | Cập nhật trạng thái đơn hàng | Staff/Admin |
| **PUT** | **`/api/orders/:id/cancel`** *(đề xuất bổ sung)* | Customer/Staff hủy đơn khi còn `Pending` | JWT |

**Ví dụ — `POST /api/orders`**

Request:
```json
{ "variant_id": 2, "quantity": 1, "coupon_id": null }
```

Response `201 Created`:
```json
{
  "message": "Đặt hàng thành công",
  "order_id": 105,
  "final_amount": 32990000,
  "order_status": "Pending"
}
```

Response `400 Bad Request`:
```json
{ "message": "Sản phẩm không đủ tồn kho" }
```

### 6.5 Payments & Coupons

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/api/payments/confirm` | Xác nhận thanh toán (gọi sp_ConfirmPayment) | JWT |
| GET | `/api/payments/:orderId` | Xem lịch sử thanh toán của đơn | JWT |
| POST | `/api/coupons/validate` | Kiểm tra mã giảm giá có hợp lệ không | JWT |
| GET | `/api/admin/coupons` | Danh sách mã giảm giá | Admin |
| POST | `/api/admin/coupons` | Tạo mã giảm giá mới | Admin |

### 6.6 Admin — Báo cáo & Tồn kho

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/admin/reports/revenue` | Doanh thu theo ngày/tháng (từ View) | Admin |
| GET | `/api/admin/reports/best-selling` | Sản phẩm bán chạy (từ View) | Admin |
| GET | `/api/admin/reports/low-stock` | Sản phẩm sắp hết hàng (từ View) | Admin |
| GET | `/api/admin/inventory` | Tổng quan tồn kho theo variant | Staff/Admin |
| PUT | `/api/admin/inventory/:variantId` | Cập nhật tồn kho thủ công | Admin |
| GET | `/api/warranties` | Danh sách bảo hành của user | JWT |

---

## 7. Backend — Cấu trúc & Logic

### 7.1 Tech stack

| Package | Phiên bản | Vai trò |
|---|---|---|
| express | ^4.x | Web framework, định nghĩa route và middleware |
| mssql | ^10.x | Driver kết nối SQL Server từ Node.js |
| jsonwebtoken | ^9.x | Tạo và xác thực JWT token |
| bcrypt | ^5.x | Hash và kiểm tra mật khẩu người dùng |
| dotenv | ^16.x | Đọc biến môi trường từ file `.env` |
| cors | ^2.x | Cho phép frontend gọi API cross-origin |
| joi | ^17.x | Validate request body trước khi xử lý |
| nodemon | dev | Tự khởi động lại server khi code thay đổi (dev) |

### 7.2 Cấu trúc thư mục

```
applezone-backend/
├── src/
│   ├── config/
│   │   └── db.js              # Kết nối SQL Server (mssql pool)
│   ├── middleware/
│   │   ├── authMiddleware.js  # Xác thực JWT
│   │   └── roleMiddleware.js  # Kiểm tra quyền (customer/staff/admin)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   └── admin.js
│   └── app.js                 # Khởi tạo Express, mount routes
├── .env
└── package.json
```

### 7.3 Kết nối SQL Server (`src/config/db.js`)

```javascript
const sql = require('mssql');
require('dotenv').config();

const config = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,   // e.g. 'localhost'
  database: process.env.DB_NAME,     // 'AppleZoneDB'
  options:  { encrypt: false, trustServerCertificate: true }
};

let pool;
async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}
module.exports = { getPool, sql };
```

### 7.4 Middleware xác thực và phân quyền

```javascript
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
}

// middleware/roleMiddleware.js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    next();
  };
}

// Dùng trong route:
// router.get('/admin/orders', authMiddleware, requireRole('staff','admin'), ...)
module.exports = { authMiddleware, requireRole };
```

### 7.5 Ví dụ controller gọi Stored Procedure

```javascript
// controllers/orderController.js
const { getPool, sql } = require('../config/db');

async function createOrder(req, res) {
  const { variant_id, quantity } = req.body;
  const user_id = req.user.id;
  try {
    const pool = await getPool();
    await pool.request()
      .input('user_id',    sql.Int, user_id)
      .input('variant_id', sql.Int, variant_id)
      .input('quantity',   sql.Int, quantity)
      .execute('sp_CreateOrder');                // Gọi Stored Procedure
    res.status(201).json({ message: 'Đặt hàng thành công' });
  } catch (err) {
    if (err.number === 50001)
      return res.status(400).json({ message: 'Sản phẩm không đủ tồn kho' });
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
}
module.exports = { createOrder };
```

### 7.6 Phân công nhiệm vụ backend

| Thành viên | File / Module | Nhiệm vụ cụ thể |
|---|---|---|
| Phú | `config/db.js`, `app.js`, `authMiddleware.js`, `roleMiddleware.js`, `routes/auth.js`, `authController.js` | Kết nối DB, khởi tạo Express, đăng ký/đăng nhập, JWT, hash mật khẩu, middleware xác thực và phân quyền. |
| Nam | `routes/orders.js`, `orderController.js`, `routes/payments.js`, `paymentController.js` | API tạo đơn hàng (gọi sp_CreateOrder), xem đơn hàng, xác nhận thanh toán (gọi sp_ConfirmPayment). |
| Minh | `routes/products.js`, `productController.js`, `routes/cart.js`, `cartController.js` | API danh sách/chi tiết sản phẩm, biến thể, lọc theo danh mục; API giỏ hàng thêm/xóa/cập nhật. |
| Phúc | `routes/admin.js`, `adminController.js`, payments (coupon), `.env`/`package.json` | API admin: báo cáo doanh thu (gọi View), sản phẩm bán chạy, tồn kho, mã giảm giá, cấu hình môi trường. |

---

## 8. DBMS Showcase — Transaction, Concurrency, Deadlock

### 8.1 Tổng quan cách demo

| Nội dung DBMS | Cách demo |
|---|---|
| Thiết kế CSDL | ERD, khóa chính, khóa ngoại, quan hệ 1-n, chuẩn hóa ProductVariant. |
| Transaction | Gọi API `POST /api/orders`; theo dõi `BEGIN TRANSACTION → COMMIT/ROLLBACK` trong SSMS. |
| Concurrency Control | Mở 2 tab browser cùng đặt sản phẩm còn 1 cái → chỉ 1 thành công. |
| Deadlock | Chạy 2 script SQL song song ngược thứ tự khóa; quan sát DBMS chọn victim. |
| Trigger | Gọi API xác nhận thanh toán → Order tự chuyển `Confirmed`; bảo hành tự tạo. |
| Stored Procedure | `sp_CreateOrder`, `sp_ConfirmPayment` được gọi từ Node.js controller. |
| Index | Dùng `SET STATISTICS IO ON`; so sánh query plan trước và sau khi tạo index. |
| View | Gọi `GET /api/admin/reports/revenue` → backend SELECT từ View trả JSON. |
| Role/Permission | Login bằng 3 tài khoản khác role; thử gọi API admin bằng customer → `403`. |
| Backup/Restore | Backup DB trước demo; thử restore và kiểm tra dữ liệu còn nguyên. |

### 8.2 Transaction — Kịch bản đặt hàng

```sql
BEGIN TRANSACTION;

INSERT INTO Orders(user_id, total_amount, discount_amount, final_amount,
                   order_status, payment_status, created_at)
VALUES (1, 32990000, 0, 32990000, 'Pending', 'Unpaid', GETDATE());
DECLARE @order_id INT = SCOPE_IDENTITY();

INSERT INTO OrderItems(order_id, variant_id, quantity, unit_price)
VALUES (@order_id, 2, 1, 32990000);

UPDATE ProductVariants
SET stock_quantity = stock_quantity - 1
WHERE variant_id = 2 AND stock_quantity >= 1;

IF @@ROWCOUNT = 0
BEGIN
    ROLLBACK;
    THROW 50001, N'Sản phẩm đã hết hàng', 1;
END;

INSERT INTO Payments(order_id, payment_method, amount, payment_status)
VALUES (@order_id, 'COD', 32990000, 'Pending');

COMMIT;
```

**Tính chất ACID minh họa:**
- **Atomicity:** Nếu bất kỳ bước nào lỗi (hết hàng), toàn bộ `ROLLBACK` — không có Order "treo" thiếu OrderItems hoặc Payment.
- **Consistency:** Ràng buộc `CHECK (stock_quantity >= 0)` đảm bảo kho không âm.
- **Isolation:** Điều kiện `WHERE stock_quantity >= 1` trong `UPDATE` hoạt động như một điểm kiểm tra dưới mức cô lập mặc định (READ COMMITTED), kết hợp row lock của SQL Server trong transaction.
- **Durability:** Sau `COMMIT`, dữ liệu được ghi bền vào transaction log.

### 8.3 Concurrency — Tránh bán quá tồn kho

```sql
UPDATE ProductVariants
SET stock_quantity = stock_quantity - @quantity
WHERE variant_id = @variant_id
  AND stock_quantity >= @quantity;

IF @@ROWCOUNT = 0
BEGIN
    ROLLBACK;
    THROW 50002, N'Không đủ tồn kho để đặt hàng', 1;
END;
```

> Khi 2 session cùng `UPDATE` một dòng `ProductVariants`, SQL Server tự áp dụng **row-level lock**: session thứ 2 phải đợi session 1 `COMMIT`/`ROLLBACK` xong mới đọc được giá trị `stock_quantity` mới nhất — đảm bảo không có 2 đơn cùng trừ vào 1 đơn vị hàng cuối.

### 8.4 Deadlock — Hai session ngược thứ tự

| Session 1 | Session 2 |
|---|---|
| `BEGIN TRANSACTION;`<br>`UPDATE Orders SET order_status='Processing' WHERE order_id=1;`<br>`WAITFOR DELAY '00:00:10';`<br>`UPDATE ProductVariants SET stock_quantity=stock_quantity-1 WHERE variant_id=2;`<br>`COMMIT;` | `BEGIN TRANSACTION;`<br>`UPDATE ProductVariants SET stock_quantity=stock_quantity-1 WHERE variant_id=2;`<br>`WAITFOR DELAY '00:00:10';`<br>`UPDATE Orders SET order_status='Cancelled' WHERE order_id=1;`<br>`COMMIT;` |

**Giải thích:** Session 1 khóa `Orders.order_id=1` trước rồi chờ khóa `ProductVariants.variant_id=2`; Session 2 khóa `ProductVariants.variant_id=2` trước rồi chờ khóa `Orders.order_id=1` → vòng chờ chéo (circular wait) → SQL Server Lock Monitor phát hiện deadlock và chọn 1 transaction làm **victim** để rollback (lỗi 1205), transaction còn lại tiếp tục.

### 8.5 Trigger và Stored Procedure

**Trigger cập nhật trạng thái đơn sau thanh toán:**

```sql
CREATE TRIGGER trg_UpdateOrderAfterPayment
ON Payments AFTER UPDATE
AS
BEGIN
    UPDATE Orders
    SET payment_status='Paid', order_status='Confirmed'
    WHERE order_id IN (SELECT order_id FROM inserted WHERE payment_status='Paid');
END;
```

**Stored Procedure tạo đơn hàng:**

```sql
CREATE PROCEDURE sp_CreateOrder @user_id INT, @variant_id INT, @quantity INT
AS
BEGIN
    BEGIN TRANSACTION;
    DECLARE @price DECIMAL(18,2);
    SELECT @price = price FROM ProductVariants WHERE variant_id = @variant_id;

    UPDATE ProductVariants SET stock_quantity = stock_quantity - @quantity
    WHERE variant_id = @variant_id AND stock_quantity >= @quantity;
    IF @@ROWCOUNT = 0 BEGIN ROLLBACK; THROW 50001, N'Không đủ tồn kho', 1; END;

    INSERT INTO Orders(user_id,total_amount,discount_amount,final_amount,
                       order_status,payment_status,created_at)
    VALUES (@user_id,@price*@quantity,0,@price*@quantity,'Pending','Unpaid',GETDATE());
    DECLARE @order_id INT = SCOPE_IDENTITY();

    INSERT INTO OrderItems(order_id,variant_id,quantity,unit_price)
    VALUES (@order_id,@variant_id,@quantity,@price);
    COMMIT;
END;
```

**Stored Procedure đề xuất bổ sung — hoàn kho khi hủy đơn:**

```sql
CREATE PROCEDURE sp_CancelOrder @order_id INT
AS
BEGIN
    BEGIN TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM Orders WHERE order_id=@order_id AND order_status='Pending')
    BEGIN
        ROLLBACK;
        THROW 50005, N'Chỉ có thể hủy đơn ở trạng thái Pending', 1;
    END;

    UPDATE pv
    SET pv.stock_quantity = pv.stock_quantity + oi.quantity
    FROM ProductVariants pv
    JOIN OrderItems oi ON pv.variant_id = oi.variant_id
    WHERE oi.order_id = @order_id;

    UPDATE Orders SET order_status='Cancelled' WHERE order_id=@order_id;

    COMMIT;
END;
```

---

## 9. Index, View & Tối ưu truy vấn

### 9.1 Index

| Index | Bảng | Cột | Mục đích |
|---|---|---|---|
| idx_products_category | Products | category_id | Lọc theo danh mục |
| idx_variants_sku | ProductVariants | sku | Tìm nhanh theo SKU |
| idx_variants_stock | ProductVariants | stock_quantity | Lọc sản phẩm còn hàng |
| idx_orders_user_date | Orders | user_id, created_at | Truy vấn đơn hàng theo user và thời gian |
| idx_orderitems_variant *(đề xuất)* | OrderItems | variant_id | Tăng tốc View bán chạy (GROUP BY variant) |

### 9.2 View

| View | Mô tả |
|---|---|
| vw_DailyRevenue | Doanh thu theo ngày (`SUM(final_amount)` từ Orders `Confirmed`) |
| vw_BestSellingProducts | Top sản phẩm bán chạy (`COUNT` OrderItems `GROUP BY` variant) |
| vw_LowStockVariants | Biến thể sắp hết hàng (`stock_quantity < 5`) |

### 9.3 Phương pháp đo hiệu năng (demo)

```sql
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
-- chạy truy vấn trước khi tạo index, ghi nhận logical reads
-- CREATE INDEX ...
-- chạy lại truy vấn, so sánh logical reads & execution time
```

---

## 10. Phân quyền & Bảo mật

### 10.1 Phân quyền người dùng

| Vai trò | Quyền trong App | Quyền SQL Server |
|---|---|---|
| Customer | Xem sản phẩm, đặt hàng, xem đơn của mình, kích hoạt bảo hành. | `SELECT` trên Products, Variants, Orders (chỉ của mình), `EXECUTE sp_CreateOrder` |
| Staff | Tất cả quyền Customer + cập nhật trạng thái đơn, xem tồn kho. | `SELECT/UPDATE` Orders, `SELECT` ProductVariants, `EXECUTE sp_ConfirmPayment` |
| Admin | Toàn quyền: quản lý sản phẩm, người dùng, báo cáo, cấu hình. | Toàn quyền tất cả bảng, View, SP, Trigger |

### 10.2 Bảo mật ứng dụng

| Lớp bảo mật | Biện pháp |
|---|---|
| Mật khẩu | Hash bằng `bcrypt`, không lưu plaintext |
| Xác thực | JWT có thời hạn hết hạn (expiry); refresh token (đề xuất nếu mở rộng) |
| Phân quyền API | Middleware `roleMiddleware` chặn truy cập route theo `role` |
| Input validation | `Joi` schema validate toàn bộ request body trước khi vào controller |
| SQL Injection | Luôn dùng parameterized query (`pool.request().input(...)`), không nối chuỗi SQL trực tiếp |
| CORS | Giới hạn origin được phép gọi API qua middleware `cors` |
| Least privilege (DB) | Mỗi role SQL Server chỉ có quyền tối thiểu cần thiết, không dùng `sa`/`dbo` cho ứng dụng |

### 10.3 Khuyến nghị bổ sung (chưa có trong bản gốc)

- Rate limiting cho `/api/auth/login` để chống brute-force.
- Logging (audit trail) cho các hành động Admin nhạy cảm (sửa giá, xóa sản phẩm, hoàn tiền).
- Mã hóa kết nối DB (`encrypt: true`) khi triển khai production thay vì `encrypt: false` (chỉ phù hợp môi trường dev local).

---

## 11. Giao diện người dùng

### 11.1 Giao diện web mô phỏng TopZone

| Màn hình | Mô tả | API gọi |
|---|---|---|
| Trang chủ | Header đen, logo, menu danh mục, banner, sản phẩm nổi bật. | `GET /api/categories`, `GET /api/products` |
| Danh sách SP | Lọc danh mục/giá/màu/dung lượng, card sản phẩm. | `GET /api/products?category=&minPrice=` |
| Chi tiết SP | Chọn màu/dung lượng, giá, tồn kho, nút thêm giỏ/mua ngay. | `GET /api/products/:id/variants` |
| Giỏ hàng | Danh sách, chỉnh số lượng, nhập coupon, tổng tiền, đặt hàng. | `GET /api/cart`, `POST /api/coupons/validate`, `POST /api/orders` |
| Admin dashboard | Doanh thu, đơn mới, bán chạy, sắp hết hàng. | `GET /api/admin/reports/*`, `GET /api/admin/orders` |

### 11.2 Màn hình đề xuất bổ sung

| Màn hình | Mô tả | API gọi |
|---|---|---|
| Đăng ký/Đăng nhập | Form nhập email/password, thông báo lỗi rõ ràng. | `POST /api/auth/register`, `POST /api/auth/login` |
| Theo dõi đơn hàng | Timeline trạng thái đơn (Pending → Confirmed → Shipped → Delivered). | `GET /api/orders/:id` |
| Trang bảo hành | Danh sách sản phẩm còn/đã hết bảo hành, serial number. | `GET /api/warranties` |
| Trang xác nhận thanh toán | Giả lập chọn phương thức (COD/chuyển khoản/ví), nút xác nhận. | `POST /api/payments/confirm` |

---

## 12. Yêu cầu phi chức năng (Non-Functional Requirements)

| Hạng mục | Yêu cầu |
|---|---|
| **Hiệu năng** | API danh sách sản phẩm phản hồi < 500ms với dataset demo (~1000 sản phẩm); sử dụng index cho các truy vấn lọc thường gặp. |
| **Khả năng đồng thời** | Hệ thống xử lý đúng khi ≥ 2 request đặt hàng cùng lúc vào 1 biến thể còn ít hàng (đã minh họa ở mục 8.3). |
| **Toàn vẹn dữ liệu** | Mọi giao dịch ảnh hưởng nhiều bảng (đặt hàng, hủy đơn) phải nguyên tử (transaction). |
| **Bảo mật** | Không để lộ `password_hash`, `JWT_SECRET`; áp dụng theo mục 10.2. |
| **Khả năng mở rộng** | Cấu trúc thư mục backend phân lớp (routes/controllers/middleware) cho phép thêm module mới không phá vỡ code cũ. |
| **Khả năng bảo trì** | Logic nghiệp vụ phức tạp (đặt hàng, thanh toán) đóng gói trong Stored Procedure, dễ kiểm tra độc lập với code Node.js. |
| **Khả năng phục hồi** | Có quy trình Backup/Restore database được kiểm thử trước khi demo. |
| **Khả năng quan sát (Observability)** | (Đề xuất) Ghi log lỗi server-side (status 500) để debug nhanh khi demo gặp sự cố. |

---

## 13. Kế hoạch triển khai & Phân công

### 13.1 Thành viên nhóm & Phân công theo giai đoạn

| Bước | Nhiệm vụ | Người phụ trách | Kết quả bàn giao |
|---|---|---|---|
| 1 | Thiết kế ERD, xác định quan hệ, chuẩn hóa 3NF | Cả nhóm | Ảnh ERD, `CREATE_DATABASE.sql` |
| 2 | Tạo bảng SQL Server (DDL), khóa, ràng buộc | Cả nhóm | `CREATE_TABLE.sql` |
| 3 | Thêm dữ liệu mẫu (INSERT) | Cả nhóm | `INSERT_DATA.sql` |
| 4 | Stored Procedure và Trigger | Cả nhóm | `SP_TRIGGER.sql` |
| 5 | Demo Transaction, Concurrency, Deadlock | Cả nhóm | `DEMO_SCRIPTS.sql`, ảnh kết quả |
| 6 | Index, View báo cáo, Phân quyền, Backup | Cả nhóm | `INDEX_VIEW.sql`, `PERMISSION.sql` |
| 7 | Backend Node.js + Express – Config, Auth, Middleware | Phú | Source code, `.env.example` |
| 8 | Backend – API Products, Categories, Cart | Minh | Routes + controllers, test Postman |
| 9 | Backend – API Orders, Payments, Admin | Nam | Routes + controllers, test Postman |
| 10 | Frontend web mini (HTML/CSS hoặc React) | Nhi + Phúc | Source code frontend |
| 11 | Báo cáo Word | Nhi | Báo cáo Word, file PPT |

> **Lưu ý:** Bản gốc chưa điền cột "Hỗ trợ", "Deadline", "Trạng thái" — cần bổ sung khi nhóm họp phân chia cụ thể thời gian.

### 13.2 Checklist bàn giao trước demo

- [ ] Script `CREATE_DATABASE.sql`, `CREATE_TABLE.sql` chạy được từ đầu trên SQL Server sạch.
- [ ] Dữ liệu mẫu đủ để minh họa hết hàng (ít nhất 1 variant có `stock_quantity = 1`).
- [ ] Toàn bộ Stored Procedure, Trigger, View, Index đã tạo và test.
- [ ] 3 tài khoản demo (customer/staff/admin) sẵn sàng với quyền SQL Server tương ứng.
- [ ] Backup file `.bak` đã tạo trước buổi demo.
- [ ] Backend chạy ổn định, đã test toàn bộ endpoint bằng Postman/Thunder Client.
- [ ] Frontend kết nối đúng API, không còn URL mock/hardcode.

---

## 14. Rủi ro & Hướng phát triển

### 14.1 Rủi ro kỹ thuật

| Rủi ro | Mức độ | Giải pháp giảm thiểu |
|---|---|---|
| Quên hoàn kho khi hủy đơn | Cao | Triển khai `sp_CancelOrder` như đề xuất ở mục 8.5 |
| Xác nhận thanh toán trùng lặp | Trung bình | Kiểm tra `payment_status` hiện tại trước khi update (idempotency check) |
| Demo deadlock không tái hiện được do timing | Trung bình | Dùng `WAITFOR DELAY` đủ lớn (≥10s) và chạy đúng 2 cửa sổ SSMS riêng biệt |
| Lộ thông tin nhạy cảm qua API lỗi (stack trace) | Trung bình | Không trả `err.message` chi tiết ra ngoài ở môi trường production |
| Coupon dùng vượt `usage_limit` do thiếu cột đếm | Thấp–Trung bình | Bổ sung `Coupons.used_count` và kiểm tra trong API validate |

### 14.2 Hướng phát triển mở rộng (ngoài phạm vi báo cáo gốc)

- Tích hợp cổng thanh toán thực tế (VNPay/Momo sandbox) thay thế giả lập COD/chuyển khoản.
- Thêm bảng `Reviews`/`Ratings` cho sản phẩm.
- Thêm hệ thống thông báo (email/SMS) khi đơn hàng đổi trạng thái.
- Áp dụng caching (Redis) cho danh sách sản phẩm để giảm tải DB khi traffic tăng.
- Viết unit test cho Stored Procedure bằng tSQLt hoặc test tích hợp cho API bằng Jest + Supertest.

---

## 15. Kết luận

Đề tài **AppleZone E-commerce System** kết hợp thiết kế CSDL chuyên sâu với một backend REST API Node.js + Express thực tế, phù hợp để demo toàn bộ kiến thức môn **Hệ Quản Trị Cơ Sở Dữ Liệu**: ERD, transaction, concurrency, deadlock, trigger, stored procedure, index, view và phân quyền.

Backend gọi trực tiếp Stored Procedure thay vì viết SQL thuần trong code, giúp demo rõ ràng vai trò của DBMS trong ứng dụng thực tế, tăng tính bảo mật và dễ bảo trì.

So với bản báo cáo gốc (v2), tài liệu đặc tả này đã bổ sung: ERD chi tiết với kiểu dữ liệu/ràng buộc đầy đủ, state machine cho Order/Payment/Warranty, luồng nghiệp vụ end-to-end, bảng mã lỗi, ví dụ request/response JSON, các quy tắc nghiệp vụ còn thiếu (hoàn kho khi hủy đơn, idempotency thanh toán, đếm lượt dùng coupon), cùng các yêu cầu phi chức năng và checklist bàn giao — nhằm làm tài liệu sẵn sàng cho cả việc lập trình và viết báo cáo cuối kỳ.