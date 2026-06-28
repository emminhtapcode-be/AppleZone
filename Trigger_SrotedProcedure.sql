-- =========================================================
-- 1. NẠP STORED PROCEDURE ĐẶT HÀNG (SP)
-- =========================================================
CREATE PROCEDURE sp_CreateOrder
    @user_id INT,
    @variant_id INT,
    @quantity INT
AS
BEGIN
    SET XACT_ABORT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        
        DECLARE @current_stock INT;
        DECLARE @item_price DECIMAL(18,2);

        -- Đọc số lượng kho và giá từ bảng ProductVariants của nhóm
        SELECT @current_stock = stock_quantity, @item_price = price 
        FROM ProductVariants 
        WHERE variant_id = @variant_id;

        IF @current_stock < @quantity
        BEGIN
            RAISERROR(N'Lỗi: Kho không đủ số lượng máy!', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @total_amount DECIMAL(18,2) = @item_price * @quantity;
        DECLARE @new_order_id INT;

        -- Chèn đơn hàng mới khớp các cột của nhóm
        INSERT INTO Orders (user_id, coupon_id, address_id, total_amount, discount_amount, final_amount, order_status, payment_status)
        VALUES (@user_id, NULL, NULL, @total_amount, 0, @total_amount, 'pending', 'unpaid');

        SET @new_order_id = SCOPE_IDENTITY();

        -- Chèn chi tiết mặt hàng vào OrderItems
        INSERT INTO OrderItems (order_id, variant_id, quantity, unit_price)
        VALUES (@new_order_id, @variant_id, @quantity, @item_price);

        -- Chèn thông tin thanh toán mặc định vào Payments
        INSERT INTO Payments (order_id, payment_method, amount, payment_status, paid_at)
        VALUES (@new_order_id, 'banking', @total_amount, 'pending', NULL);

        -- Cập nhật trừ số lượng kho
        UPDATE ProductVariants
        SET stock_quantity = stock_quantity - @quantity
        WHERE variant_id = @variant_id;

        COMMIT TRANSACTION;
        PRINT N'Thành công: Đã tạo đơn hàng AppleZone chuẩn cấu trúc nhóm!';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =========================================================
-- 2. NẠP TRIGGER TỰ ĐỘNG BẢO HÀNH (CÀI VÀO BẢNG PAYMENTS)
-- =========================================================
CREATE TRIGGER trg_UpdateOrderAfterPayment
ON Payments
AFTER UPDATE
AS
BEGIN
    -- Kiểm tra nếu trạng thái chuyển từ 'pending' sang 'completed'
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.payment_id = d.payment_id 
               WHERE i.payment_status = 'completed' AND d.payment_status = 'pending')
    BEGIN
        -- Cập nhật đơn hàng thành công
        UPDATE Orders
        SET order_status = 'confirmed', payment_status = 'paid'
        WHERE order_id IN (SELECT order_id FROM inserted);

        -- Tự sinh mã bảo hành 12 tháng vào bảng Warranties
        INSERT INTO Warranties (order_item_id, serial_number, start_date, end_date, status)
        SELECT 
            oi.order_item_id,
            UPPER(SUBSTRING(REPLACE(CONVERT(VARCHAR(50), NEWID()), '-', ''), 1, 12)) AS serial_number,
            CAST(GETDATE() AS DATE) AS start_date,
            CAST(DATEADD(YEAR, 1, GETDATE()) AS DATE) AS end_date,
            'active'
        FROM OrderItems oi
        JOIN inserted i ON oi.order_id = i.order_id;

        PRINT N'Thành công: Trigger đã duyệt đơn và kích hoạt bảo hành AppleZone!';
    END
END;
GO