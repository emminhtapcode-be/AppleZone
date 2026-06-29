USE AppleZone;
GO

-- 1. Transaction Đặt hàng (Có check tồn kho)
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @order_id INT;
    DECLARE @variant_id INT = 1;
    DECLARE @quantity INT = 2;
    DECLARE @user_id INT = 1;
    DECLARE @address_id INT = 1;
    DECLARE @price DECIMAL(18,2);
    DECLARE @total DECIMAL(18,2);
    DECLARE @current_stock INT;
    
    -- Lấy giá và số lượng tồn kho hiện tại
    SELECT @price = price, @current_stock = stock_quantity 
    FROM ProductVariants WITH (UPDLOCK, ROWLOCK) -- Khóa dòng để tránh Race Condition
    WHERE variant_id = @variant_id;
    
    -- KIỂM TRA TỒN KHO
    IF @current_stock < @quantity
    BEGIN
        THROW 50001, N'Không đủ hàng trong kho!', 1;
    END
 
    SET @total = @price * @quantity;
 
    INSERT INTO Orders (user_id, shipping_address_id, total_amount, final_amount, order_status, payment_status)
    VALUES (@user_id, @address_id, @total, @total, 'Pending', 'Unpaid');
 
    SET @order_id = SCOPE_IDENTITY();
 
    INSERT INTO OrderItems (order_id, variant_id, quantity, unit_price)
    VALUES (@order_id, @variant_id, @quantity, @price);
 
    UPDATE ProductVariants
    SET stock_quantity = stock_quantity - @quantity
    WHERE variant_id = @variant_id;
 
    INSERT INTO OrderTracking (order_id, status, note)
    VALUES (@order_id, 'Pending', N'Đơn hàng đã được tạo');
 
    COMMIT TRANSACTION;
    SELECT CONCAT(N'✅ Đặt hàng thành công! Order ID: ', @order_id, N' | Tổng tiền: ', @total) AS result;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CONCAT(N'❌ Lỗi Đặt Hàng: ', ERROR_MESSAGE()) AS result;
END CATCH;
GO
-- 2. Transaction Thanh toán (Tự động lấy số tiền thực tế từ Orders)
BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @order_id INT = 2; -- Thay order_id tương ứng để test
    DECLARE @actual_amount DECIMAL(18,2);

    -- Lấy số tiền thực tế của đơn hàng cần thanh toán
    SELECT @actual_amount = final_amount 
    FROM Orders 
    WHERE order_id = @order_id;
    
    -- Nếu không tìm thấy đơn hàng
    IF @actual_amount IS NULL
    BEGIN
        THROW 50002, N'Đơn hàng không tồn tại!', 1;
    END

    -- Dùng biến @actual_amount thay vì con số cố định
    INSERT INTO Payments (order_id, payment_method, amount, payment_status, paid_at)
    VALUES (@order_id, N'VNPay', @actual_amount, 'Paid', GETDATE());
 
    UPDATE Orders
    SET payment_status = 'Paid', order_status = 'Confirmed'
    WHERE order_id = @order_id;
 
    INSERT INTO OrderTracking (order_id, status, note)
    VALUES (@order_id, 'Confirmed', N'Thanh toán thành công');
 
    COMMIT TRANSACTION;
    SELECT N'✅ Thanh toán thành công!' AS result;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CONCAT(N'❌ Lỗi Thanh Toán: ', ERROR_MESSAGE()) AS result;
END CATCH;
GO