-- Trigger: Tự tạo bảo hành khi Payment = completed
CREATE TRIGGER trg_TaoBaoHanh
ON Payments
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(payment_status)
    BEGIN
        INSERT INTO Warranties (order_item_id, serial_number, start_date, end_date)
        SELECT
            oi.order_item_id,
            UPPER(NEWID()), -- Serial tạm (nhập thủ công)
            CAST(GETDATE() AS DATE),
            CAST(DATEADD(YEAR, 1, GETDATE()) AS DATE)
        FROM inserted i
        JOIN Orders o ON i.order_id = o.order_id
        JOIN OrderItems oi ON o.order_id = oi.order_id
        WHERE i.payment_status = 'completed'
          AND NOT EXISTS (
              SELECT 1 FROM Warranties w WHERE w.order_item_id = oi.order_item_id
          );
    END
END;
GO
