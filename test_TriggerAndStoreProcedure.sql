

-- 1. Nạp 1 danh mục máy Apple
INSERT INTO Categories (category_name, slug, status) 
VALUES (N'iPhone', 'iphone', 'active');

-- 2. Nạp 1 tài khoản người dùng (Hệ thống sẽ tự sinh ra mã user_id)
INSERT INTO Users (full_name, email, phone, password_hash, role) 
VALUES (N'Nguyễn Văn Khách', 'khachhang@applezone.com', '0901234567', 'hash_123', 'customer');

-- 3. Nạp 1 sản phẩm gốc
INSERT INTO Products (category_id, product_name, base_price, status) 
VALUES (1, N'iPhone 15 Pro Max', 30000000, 'active');

-- 4. Nạp 1 biến thể có sẵn trong kho 10 cái (Hệ thống tự sinh variant_id)
INSERT INTO ProductVariants (product_id, color, storage, sku, price, stock_quantity, status) 
VALUES (1, N'Titan Tự Nhiên', '256GB', 'IP15PM-256GB-TITAN', 32000000, 10, 'active');
GO


DECLARE @Available_User_ID INT;
DECLARE @Available_Variant_ID INT;

-- Tự động tìm đúng mã ID vừa nạp ở trên để truyền vào hàm
SELECT TOP 1 @Available_User_ID = user_id FROM Users WHERE email = 'khachhang@applezone.com';
SELECT TOP 1 @Available_Variant_ID = variant_id FROM ProductVariants WHERE sku = 'IP15PM-256GB-TITAN';

-- 1. TEST STORED PROCEDURE ĐẶT HÀNG
EXEC sp_CreateOrder 
    @user_id = @Available_User_ID, 
    @variant_id = @Available_Variant_ID, 
    @quantity = 1;
GO

-- 2. TEST TRIGGER DUYỆT ĐƠN TỰ ĐỘNG
DECLARE @Latest_Order_ID INT;
SELECT TOP 1 @Latest_Order_ID = order_id FROM Orders ORDER BY created_at DESC;

UPDATE Payments 
SET payment_status = 'completed' 
WHERE order_id = @Latest_Order_ID;
GO