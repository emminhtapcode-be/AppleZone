-- Bảng Categories
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(10) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive'))
);
GO

-- Bảng Users 
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(15) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'Customer'
    CHECK (role IN ('Customer','Staff','Admin')),
    avatar_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Bảng UserAddresses
CREATE TABLE UserAddresses (
    address_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    receiver_name NVARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address_line NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    district NVARCHAR(100) NOT NULL,
    ward NVARCHAR(100) NULL,
    is_default BIT NOT NULL DEFAULT 0
);
GO

-- Bảng Products
CREATE TABLE Products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL REFERENCES Categories(category_id),
    product_name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    base_price DECIMAL(18,2) NOT NULL CHECK (base_price >= 0),
    status VARCHAR(10) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive'))
);
GO

-- Bảng ProductVariants
CREATE TABLE ProductVariants (
    variant_id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL REFERENCES Products(product_id),
    color NVARCHAR(50) NULL,
    storage NVARCHAR(50) NULL,   -- ví dụ: '128GB','256GB'
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(18,2) NOT NULL CHECK (price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    status VARCHAR(10) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive'))
);
GO

-- Bảng ProductImages
CREATE TABLE ProductImages (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
    image_url VARCHAR(500) NOT NULL,
    is_primary BIT NOT NULL DEFAULT 0
);
GO

-- Bảng Coupons
CREATE TABLE Coupons (
    coupon_id INT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent','fixed')),
    discount_value DECIMAL(18,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    usage_limit INT NULL   -- NULL = không giới hạn
);
GO

-- Bảng Orders
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    coupon_id INT NULL REFERENCES Coupons(coupon_id),
    address_id INT NULL REFERENCES UserAddresses(address_id),
    total_amount DECIMAL(18,2) NOT NULL CHECK (total_amount >= 0),
    discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(18,2) NOT NULL CHECK (final_amount >= 0),
    order_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (order_status IN ('pending','confirmed','shipping','delivered','cancelled')),
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','paid','refunded')),
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Bảng OrderItems
CREATE TABLE OrderItems (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL REFERENCES Orders(order_id),
    variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL CHECK (unit_price >= 0)
);
GO

-- Bảng Payments
CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL REFERENCES Orders(order_id),
    payment_method VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('COD','banking','ewallet','installment','VNPay')),
    amount DECIMAL(18,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','completed','failed')),
    paid_at DATETIME NULL
);
GO

-- Bảng Carts
CREATE TABLE Carts (
    cart_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES Users(user_id),
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Bảng CartItems 
CREATE TABLE CartItems (
    cart_item_id INT IDENTITY(1,1) PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES Carts(cart_id),
    variant_id INT NOT NULL REFERENCES ProductVariants(variant_id),
    quantity INT NOT NULL CHECK (quantity > 0),
    UNIQUE (cart_id, variant_id)  -- Không trùng variant trong 1 giỏ
);
GO

-- Bảng Warranties
CREATE TABLE Warranties (
    warranty_id INT IDENTITY(1,1) PRIMARY KEY,
    order_item_id INT NOT NULL UNIQUE REFERENCES OrderItems(order_item_id),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','voided'))
);
GO

-- Bảng Reviews
CREATE TABLE Reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id),
    product_id INT NOT NULL REFERENCES Products(product_id),
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment NVARCHAR(1000) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    UNIQUE (user_id, product_id)  -- Mỗi user review 1 sản phẩm 1 lần
);
GO

-- Bảng OrderTracking
CREATE TABLE OrderTracking (
    tracking_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL REFERENCES Orders(order_id),
    status NVARCHAR(100) NOT NULL,
    note NVARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE()
);
GO
