USE AppleZone;
GO

-- 1. KHỞI TẠO LOGIN VÀ USER   IF NOT ẼIT giúp script chạy lại nhiều lần (idempotent) mà không sợ bị lỗi trùng lặp dữ liệu
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'applezone_customer')
    CREATE LOGIN applezone_customer WITH PASSWORD = 'Cust@123!';
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'applezone_customer')
    CREATE USER applezone_customer FOR LOGIN applezone_customer;

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'applezone_staff')
    CREATE LOGIN applezone_staff WITH PASSWORD = 'Staff@123!';
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'applezone_staff')
    CREATE USER applezone_staff FOR LOGIN applezone_staff;

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'applezone_admin')
    CREATE LOGIN applezone_admin WITH PASSWORD = 'Admin@123!';
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'applezone_admin')
    CREATE USER applezone_admin FOR LOGIN applezone_admin;
GO

-- 2. KHỞI TẠO CÁC ROLE (NHÓM QUYỀN)

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE type = 'R' AND name = 'Customer_Role')
    CREATE ROLE Customer_Role;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE type = 'R' AND name = 'Staff_Role')
    CREATE ROLE Staff_Role;
GO

-- 3. CẤP QUYỀN CHO NHÓM KHÁCH HÀNG (Customer_Role)

-- Xem thông tin sản phẩm công khai
GRANT SELECT ON Products TO Customer_Role;
GRANT SELECT ON ProductVariants TO Customer_Role;
GRANT SELECT ON ProductImages TO Customer_Role;
GRANT SELECT ON Categories TO Customer_Role;

-- Thao tác với giỏ hàng của mình
GRANT SELECT, INSERT ON Carts TO Customer_Role;
GRANT SELECT, INSERT, UPDATE ON CartItems TO Customer_Role;

-- Thao tác đơn hàng & thông tin cá nhân
GRANT SELECT, INSERT ON Orders TO Customer_Role; 
GRANT SELECT, INSERT ON OrderItems TO Customer_Role;
GRANT SELECT ON OrderTracking TO Customer_Role;
GRANT SELECT, INSERT ON Payments TO Customer_Role;
GRANT SELECT, INSERT ON Reviews TO Customer_Role;
GRANT SELECT, INSERT, UPDATE ON UserAddresses TO Customer_Role;
GRANT SELECT ON Warranties TO Customer_Role;

-- Quyền chạy Store Procedure đặt hàng
GRANT EXECUTE ON sp_create_order TO Customer_Role;
GO

-- 4. CẤP QUYỀN CHO NHÓM NHÂN VIÊN (Staff_Role)

-- Nhân viên sẽ có các quyền đặc thù xử lý hệ thống mà Khách hàng không có:
GRANT SELECT, INSERT, UPDATE ON Orders TO Staff_Role;
GRANT SELECT, INSERT ON OrderTracking TO Staff_Role;
GRANT SELECT, UPDATE ON Warranties TO Staff_Role;
GRANT SELECT ON Users TO Staff_Role;

-- Quyền chạy các Store Procedure duyệt đơn, duyệt tiền
GRANT EXECUTE ON sp_update_order_status TO Staff_Role;
GRANT EXECUTE ON sp_ConfirmPayment TO Staff_Role;
GO

-- 5. GÁN USER VÀO CÁC NHÓM QUYỀN TƯƠNG ỨNG

-- Khách hàng thì vào nhóm Customer_Role
ALTER ROLE Customer_Role ADD MEMBER applezone_customer;

-- Nhân viên thì thừa hưởng CẢ quyền Customer + quyền đặc thù của Staff
ALTER ROLE Customer_Role ADD MEMBER applezone_staff;
ALTER ROLE Staff_Role ADD MEMBER applezone_staff;

-- Admin: Cấp quyền tối cao trực tiếp (Kiểm soát toàn bộ Schema dbo)
GRANT CONTROL ON SCHEMA::dbo TO applezone_admin;
GO

