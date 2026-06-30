CREATE PROCEDURE sp_CancelOrder @order_id INT
AS
BEGIN
    BEGIN TRANSACTION;

    -- Kiểm tra nếu đơn hàng không tồn tại hoặc không ở trạng thái pending
    IF NOT EXISTS (SELECT 1 FROM Orders WHERE order_id=@order_id AND order_status='pending')
    BEGIN
        ROLLBACK;
        THROW 50005, N'Chỉ có thể hủy đơn ở trạng thái Pending', 1;
    END;

    -- Hoàn lại kho (cộng số lượng quantity vào stock_quantity)
    UPDATE pv
    SET pv.stock_quantity = pv.stock_quantity + oi.quantity
    FROM ProductVariants pv
    JOIN OrderItems oi ON pv.variant_id = oi.variant_id
    WHERE oi.order_id = @order_id;

    -- Cập nhật trạng thái đơn hàng thành cancelled
    UPDATE Orders SET order_status='cancelled' WHERE order_id=@order_id;

    COMMIT;
END;
GO
