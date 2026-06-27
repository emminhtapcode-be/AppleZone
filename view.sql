-- View: Doanh thu theo tháng
CREATE VIEW vw_DoanhThuThang AS
SELECT
YEAR(o.created_at) AS nam,
MONTH(o.created_at) AS thang,
COUNT(DISTINCT o.order_id) AS so_don,
SUM(o.final_amount) AS doanh_thu
FROM Orders o
WHERE o.order_status != 'cancelled'
AND o.payment_status = 'paid'
GROUP BY YEAR(o.created_at), MONTH(o.created_at);
GO

-- View: Top sản phẩm bán chạy
CREATE VIEW vw_BanChay AS
SELECT TOP 10
p.product_name,
SUM(oi.quantity) AS tong_ban,
SUM(oi.quantity * oi.unit_price) AS doanh_thu
FROM OrderItems oi
JOIN ProductVariants pv ON oi.variant_id = pv.variant_id
JOIN Products p ON pv.product_id = p.product_id
JOIN Orders o ON oi.order_id   = o.order_id
WHERE o.order_status != 'cancelled'
GROUP BY p.product_id, p.product_name
ORDER BY tong_ban DESC;
GO

-- View: Hàng sắp hết (stock <= 5)
CREATE VIEW vw_SapHetHang AS
SELECT
p.product_name,
pv.color, pv.storage, pv.sku,
pv.stock_quantity
FROM ProductVariants pv
JOIN Products p ON pv.product_id = p.product_id
WHERE pv.stock_quantity <= 5 AND pv.status = 'active';
GO