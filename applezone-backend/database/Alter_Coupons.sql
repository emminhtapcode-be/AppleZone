-- Thêm cột used_count vào bảng Coupons để đếm số lượt sử dụng
ALTER TABLE Coupons
ADD used_count INT NOT NULL DEFAULT 0;
GO
