-- Index tìm sản phẩm theo danh mục
CREATE INDEX IX_Products_CategoryId ON Products(category_id);

-- Index tìm biến thể theo sản phẩm
CREATE INDEX IX_Variants_ProductId ON ProductVariants(product_id);

-- Index tra cứu đơn hàng theo user
CREATE INDEX IX_Orders_UserId ON Orders(user_id);

-- Index tra cứu chi tiết đơn hàng
CREATE INDEX IX_OrderItems_OrderId ON OrderItems(order_id);

-- Index tìm cart theo user
CREATE INDEX IX_Carts_UserId ON Carts(user_id);

-- Index tìm đánh giá theo sản phẩm
CREATE INDEX IX_Reviews_ProductId ON Reviews(product_id);
GO