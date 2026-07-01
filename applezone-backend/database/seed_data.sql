USE AppleZone;
GO

-- 1. Seed Categories
INSERT INTO Categories (category_name, slug, status) VALUES 
('iPhone', 'iphone', 'active'),
('MacBook', 'macbook', 'active'),
('iPad', 'ipad', 'active');
GO

-- 2. Seed Products
INSERT INTO Products (category_id, product_name, description, base_price, status) VALUES 
(1, 'iPhone 15 Pro Max', 'Thiết kế titan mới, chip A17 Pro mạnh mẽ.', 34990000, 'active'),
(2, 'MacBook Pro 14 M3', 'MacBook Pro với chip M3, màn hình Liquid Retina XDR.', 39990000, 'active');
GO

-- 3. Seed ProductVariants
INSERT INTO ProductVariants (product_id, color, storage, sku, price, stock_quantity, status) VALUES 
(1, 'Titan Tự nhiên', '256GB', 'IP15PM-256-NAT', 34990000, 50, 'active'),
(1, 'Titan Đen', '256GB', 'IP15PM-256-BLK', 34990000, 30, 'active'),
(1, 'Titan Tự nhiên', '512GB', 'IP15PM-512-NAT', 40990000, 20, 'active'),
(2, 'Silver', '512GB', 'MBP14-M3-512-SLV', 39990000, 15, 'active'),
(2, 'Space Black', '1TB', 'MBP14-M3-1TB-BLK', 44990000, 10, 'active');
GO

-- 4. Seed ProductImages
INSERT INTO ProductImages (variant_id, image_url, is_primary) VALUES 
(1, 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium', 1),
(2, 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium', 1),
(4, 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/mbp14-silver-select-202310', 1),
(5, 'https://store.storeimages.cdn-apple.com/8756/as-images.apple.com/is/mbp14-spaceblack-select-202310', 1);
GO

-- 5. Seed Coupons
INSERT INTO Coupons (code, discount_type, discount_value, min_order_amount, start_date, end_date, usage_limit) VALUES 
('WELCOME10', 'percent', 10, 5000000, GETDATE(), DATEADD(month, 1, GETDATE()), 100),
('GIAM500K', 'fixed', 500000, 10000000, GETDATE(), DATEADD(month, 1, GETDATE()), 50);
GO
