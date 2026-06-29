-- Reset stock trước khi demo
UPDATE ProductVariants SET stock_quantity = 20 WHERE variant_id = 1;
-- *** CHẠY Ở 2 TAB  ĐỔI TÊN KHÁCH HÀNG A thành B và B thành A ***

BEGIN TRANSACTION;
BEGIN TRY
    DECLARE @stock INT;
 
    -- PESSIMISTIC LOCK: khóa dòng lại
    SELECT @stock = stock_quantity
    FROM ProductVariants WITH (UPDLOCK, ROWLOCK)
    WHERE variant_id = 1;
 
    IF @stock < 15
    BEGIN
        -- Kiểm tra nếu transaction còn mở thì mới rollback
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; 
        SELECT CONCAT(N'[KhachA] ❌ THẤT BẠI: Chỉ còn ', @stock, N' sản phẩm') AS result;
        RETURN;
    END
 
    -- Giả lập thời gian xử lý
    WAITFOR DELAY '00:00:02';
 
    UPDATE ProductVariants
    SET stock_quantity = stock_quantity - 15
    WHERE variant_id = 1;
 
    COMMIT TRANSACTION;
    SELECT CONCAT(N'[KhachA] ✅ THÀNH CÔNG: Đã mua 15. Còn lại: ', @stock - 15) AS result;
END TRY
BEGIN CATCH
    -- Chỉ rollback nếu transaction thực sự còn tồn tại
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT CONCAT(N'[KhachA] ❌ LỖI HỆ THỐNG: ', ERROR_MESSAGE()) AS result;
END CATCH;