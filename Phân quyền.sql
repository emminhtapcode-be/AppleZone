-- Tạo login & user cho từng role
CREATE LOGIN applezone_customer WITH PASSWORD = 'Cust@123!';
CREATE USER  applezone_customer FOR LOGIN applezone_customer;

CREATE LOGIN applezone_staff WITH PASSWORD = 'Staff@123!';
CREATE USER  applezone_staff FOR LOGIN applezone_staff;

-- Quyền Customer: chỉ SELECT + thao tác giỏ/đơn của chính mình
GRANT SELECT ON Products TO applezone_customer;
GRANT SELECT ON ProductVariants TO applezone_customer;
GRANT SELECT ON Categories TO applezone_customer;
GRANT SELECT, INSERT, UPDATE ON CartItems TO applezone_customer;
GRANT EXECUTE ON sp_TaoDonHang TO applezone_customer;

-- Quyền Staff: quản lý đơn hàng, kho
GRANT SELECT, UPDATE ON Orders TO applezone_staff;
GRANT SELECT, UPDATE ON ProductVariants TO applezone_staff;
GRANT SELECT ON OrderItems TO applezone_staff;
GO