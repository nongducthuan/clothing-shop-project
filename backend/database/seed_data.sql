USE shopdb;

-- Alter table columns if missing
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS name_vi VARCHAR(100) NULL;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS name_en VARCHAR(100) NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_vi VARCHAR(100) NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_vi VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_vi TEXT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT NULL;
ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS color_name_vi VARCHAR(100) NULL;
ALTER TABLE product_colors ADD COLUMN IF NOT EXISTS color_name_en VARCHAR(100) NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS title_vi VARCHAR(255) NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS title_en VARCHAR(255) NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS subtitle_vi VARCHAR(500) NULL;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS subtitle_en VARCHAR(500) NULL;

-- Disable FK checks for clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_product_interaction;
TRUNCATE TABLE return_requests;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE promotion_usage_history;
TRUNCATE TABLE buy_x_get_y_promotions;
TRUNCATE TABLE product_vouchers;
TRUNCATE TABLE voucher_categories;
TRUNCATE TABLE vouchers;
TRUNCATE TABLE product_sales;
TRUNCATE TABLE sale_categories;
TRUNCATE TABLE sales;
TRUNCATE TABLE product_sizes;
TRUNCATE TABLE product_colors;
TRUNCATE TABLE products;
TRUNCATE TABLE categories;
TRUNCATE TABLE banners;
TRUNCATE TABLE users;
TRUNCATE TABLE memberships;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. SEED MEMBERSHIPS
-- ============================================================
INSERT INTO memberships (id, name, min_spending, discount_percent, name_vi, name_en) VALUES
(1, 'Normal', 0, 0, 'Thường', 'Normal'),
(2, 'Bronze', 5000000, 5, 'Đồng', 'Bronze'),
(3, 'Silver', 10000000, 10, 'Bạc', 'Silver'),
(4, 'Gold', 15000000, 15, 'Vàng', 'Gold'),
(5, 'Diamond', 20000000, 20, 'Kim Cương', 'Diamond');

-- ============================================================
-- 2. SEED USERS
-- ============================================================
INSERT INTO users (id, name, email, password, role) VALUES
(3, 'Nguyễn Văn A', 'vana@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(4, 'Trần Thị B', 'thib@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(5, 'Lê Văn C', 'vanc@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(6, 'Phạm Minh D', 'minhd@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(7, 'Hoàng Lan E', 'lane@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(8, 'Đỗ Hùng F', 'hungf@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(9, 'Bùi Mai G', 'maig@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(10, 'Ngô Quang H', 'quangh@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(11, 'Vũ Hải I', 'haii@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(12, 'Phan An K', 'ank@example.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'customer'),
(13, 'Admin', 'admin@shop.com', '$2a$10$w8.3fVq7c3.j0k.k0k.k0k.k0k.k0k.k0k.k0k.k0k', 'admin');

-- ============================================================
-- 3. SEED CATEGORIES
-- ============================================================
INSERT INTO categories (id, name, gender, image_url, name_vi, name_en) VALUES
(1, 'Shirt', 'male', NULL, 'Áo Sơ Mi', 'Shirt'),
(2, 'Trousers/Pants', 'male', NULL, 'Quần Dài', 'Trousers/Pants'),
(3, 'Jacket/Hoodie', 'male', NULL, 'Áo Khoác', 'Jacket/Hoodie'),
(4, 'Shirt', 'female', NULL, 'Áo Sơ Mi', 'Shirt'),
(5, 'T-shirt', 'female', NULL, 'Áo Thun', 'T-shirt'),
(6, 'Trousers/Pants', 'female', NULL, 'Quần Dài', 'Trousers/Pants'),
(7, 'T-shirt', 'unisex', NULL, 'Áo Thun', 'T-shirt'),
(8, 'Trousers/Pants', 'unisex', NULL, 'Quần Dài', 'Trousers/Pants'),
(9, 'Shorts', 'unisex', NULL, 'Quần Short', 'Shorts');

-- ============================================================
-- 4. SEED PRODUCTS (IDs 1 -> 36)
-- ============================================================
INSERT INTO products (id, name, description, price, import_price, image_url, category_id, gender, name_vi, name_en, description_vi, description_en) VALUES
(1, 'Premium Oxford Cotton Shirt', 'High density Oxford cotton with button-down collar, perfect for business casual', 150000, 100000, '/public/images/ao-so-mi-nam-white.png', 1, 'male', 'Áo Sơ Mi Cotton Oxford Cao Cấp', 'Premium Oxford Cotton Shirt', 'Chất liệu Oxford cotton dày dặn, cổ đơm nút lịch lãm phù hợp đi làm và đi chơi', 'High density Oxford cotton with button-down collar, perfect for business casual'),
(2, 'Ultra-Lightweight Linen Shirt', '100% natural linen, breathable and quick-drying for hot summer days', 150000, 100000, '/public/images/ao-so-mi-nam-blue.png', 1, 'male', 'Áo Sơ Mi Linen Siêu Nhẹ', 'Ultra-Lightweight Linen Shirt', '100% vải linen tự nhiên, thoáng khí và thấm hút cực tốt cho ngày hè', '100% natural linen, breathable and quick-drying for hot summer days'),
(3, 'Classic Business Formal Shirt', 'Crisp spread collar, anti-wrinkle bamboo fabric for sharp office looks', 150000, 100000, '/public/images/ao-so-mi-nam-beige.png', 1, 'male', 'Áo Sơ Mi Công Sở Classic', 'Classic Business Formal Shirt', 'Áo cổ bẻ cứng cáp, vải sợi tre chống nhăn giữ phom dáng chuẩn công sở', 'Crisp spread collar, anti-wrinkle bamboo fabric for sharp office looks'),
(4, 'Slim-Fit Stretch Casual Shirt', 'Modern tailored fit with 5% elastane for maximum freedom of movement', 150000, 100000, '/public/images/ao-so-mi-nam-black.png', 1, 'male', 'Áo Sơ Mi Co Giãn Slim-Fit', 'Slim-Fit Stretch Casual Shirt', 'Form ôm hiện đại pha thun co giãn 4 chiều, thoải mái vận động cả ngày', 'Modern tailored fit with 5% elastane for maximum freedom of movement'),
(5, 'Slim Tapered Chino Pants', 'Durable twill weave with a modern narrow hem, ideal for smart-casual pairing', 320000, 220000, '/public/images/quan-chino-nam-beige.png', 2, 'male', 'Quần Chino Dáng Slim Tapered', 'Slim Tapered Chino Pants', 'Vải kaki dệt chéo bền bỉ, ống ôm nhẹ trẻ trung dễ phối áo sơ mi hoặc polo', 'Durable twill weave with a modern narrow hem, ideal for smart-casual pairing'),
(6, 'Relaxed Fit Utility Chino', 'Roomy fit around hips and thighs with deep functional pockets', 320000, 220000, '/public/images/quan-chino-nam-blue.png', 2, 'male', 'Quần Chino Khaki Ống Rộng', 'Relaxed Fit Utility Chino', 'Thiết kế dáng suông thoải mái phần hông và đùi, túi sâu tiện lợi', 'Roomy fit around hips and thighs with deep functional pockets'),
(7, 'Vintage Straight Denim Jeans', '13oz heavyweight indigo denim with classic contrast stitching', 320000, 220000, '/public/images/quan-jean-nam-dark-gray.png', 2, 'male', 'Quần Jean Nam Dáng Thẳng Vintage', 'Vintage Straight Denim Jeans', 'Chất liệu jean 13oz bền bỉ, đường chỉ may nổi phong cách cổ điển', '13oz heavyweight indigo denim with classic contrast stitching'),
(8, 'Modern Slim Flex Denim Jeans', 'Soft washed stretch denim providing maximum flexibility for urban wear', 320000, 220000, '/public/images/quan-jean-nam-light-blue.png', 2, 'male', 'Quần Jean Nam Slim Flex Co Giãn', 'Modern Slim Flex Denim Jeans', 'Chất jean xử lý wash mềm mại, co giãn tốt cho các hoạt động phố thị', 'Soft washed stretch denim providing maximum flexibility for urban wear'),
(9, 'Heavyweight Fleece Hoodie', '400gsm brushed fleece interior with double-layered drawstring hood', 150000, 100000, '/public/images/ao-hoodie-nam-red.png', 3, 'male', 'Áo Hoodie Nỉ Bông Dày Dặn', 'Heavyweight Fleece Hoodie', 'Chất nỉ bông 400gsm giữ nhiệt vượt trội, nón 2 lớp may chèn cao cấp', '400gsm brushed fleece interior with double-layered drawstring hood'),
(10, 'Urban Streetwear Graphic Hoodie', 'Kangaroo pocket with rib-knit cuffs, relaxed drop-shoulder silhouette', 150000, 100000, '/public/images/ao-hoodie-nam-green.png', 3, 'male', 'Áo Hoodie Streetwear Đô Thị', 'Urban Streetwear Graphic Hoodie', 'Dáng vai trễ khoẻ khoắn, túi kangaroo tiện dụng cùng bo lai co giãn tốt', 'Kangaroo pocket with rib-knit cuffs, relaxed drop-shoulder silhouette'),
(11, 'Water-Resistant Hooded Windbreaker', 'Lightweight nylon shell with mesh lining and adjustable drawstrings', 150000, 100000, '/public/images/ao-khoac-nam-blue.png', 3, 'male', 'Áo Khoác Gió Kháng Nước Có Mũ', 'Water-Resistant Hooded Windbreaker', 'Lớp vỏ nylon chống thấm nhẹ, lót lưới thoáng khí cùng dây rút tuỳ chỉnh', 'Lightweight nylon shell with mesh lining and adjustable drawstrings'),
(12, 'Packable Sports Running Windbreaker', 'Ultra-compressible design, reflective zipper elements for night runs', 150000, 100000, '/public/images/ao-khoac-nam-yellow.png', 3, 'male', 'Áo Gió Thể Thao Gọn Nhẹ', 'Packable Sports Running Windbreaker', 'Thiết kế gấp gọn dễ dàng, trang bị khoá kéo phản quang an toàn khi chạy đêm', 'Ultra-compressible design, reflective zipper elements for night runs'),
(13, 'Soft Silk-Touch Women Shirt', 'Silky smooth drape with elegant v-neckline for office sophistication', 280000, 190000, '/public/images/ao-so-mi-nu-white.png', 4, 'female', 'Áo Sơ Mi Nữ Lụa Mềm Mại', 'Soft Silk-Touch Women Shirt', 'Chất lụa rủ mềm mại, cổ V quyến rũ mang lại vẻ thanh lịch nữ tính', 'Silky smooth drape with elegant v-neckline for office sophistication'),
(14, 'Cropped Linen Blouse', 'Modern cropped waistline, breathable organic linen fabric', 280000, 190000, '/public/images/ao-so-mi-nu-green.png', 4, 'female', 'Áo Sơ Mi Nữ Dáng Cropped Linen', 'Cropped Linen Blouse', 'Chiều dài cropped hiện đại, chất liệu linen hữu cơ thoáng mát ngày hè', 'Modern cropped waistline, breathable organic linen fabric'),
(15, 'Vertical Striped Boyfriend Shirt', 'Oversized relaxed silhouette with fine pinstripes', 280000, 190000, '/public/images/ao-so-mi-nu-ke-soc-white.png', 4, 'female', 'Áo Sơ Mi Nữ Kẻ Sọc Boyfriend', 'Vertical Striped Boyfriend Shirt', 'Form rộng boyfriend thoải mái cùng hoạ tiết kẻ sọc mảnh tôn dáng', 'Oversized relaxed silhouette with fine pinstripes'),
(16, 'Mandarin Collar Casual Blouse', 'Minimalist mandarin collar with concealed button placket', 280000, 190000, '/public/images/ao-so-mi-nu-ke-soc-blue.png', 4, 'female', 'Áo Sơ Mi Nữ Cổ Tàu Nhã Nhặn', 'Mandarin Collar Casual Blouse', 'Thiết kế cổ tàu tối giản, nẹp giấu nút tinh tế phù hợp nhiều hoàn cảnh', 'Minimalist mandarin collar with concealed button placket'),
(17, 'Ribbed Contour Crop Tee', 'Stretchy ribbed knit fabric that contours comfortably to your figure', 280000, 190000, '/public/images/ao-thun-co-tron-nu-blue.png', 5, 'female', 'Áo Thun Nữ Ôm Sát Cổ Tròn', 'Ribbed Contour Crop Tee', 'Chất thun gân co giãn ôm dáng nhẹ nhàng, tôn vẻ đẹp tự nhiên', 'Stretchy ribbed knit fabric that contours comfortably to your figure'),
(18, 'Vintage Wash Oversized Female Tee', 'Soft vintage washed cotton with drop shoulder pattern', 280000, 190000, '/public/images/ao-thun-co-tron-nu-navy.png', 5, 'female', 'Áo Thun Nữ Form Rộng Wash Vintage', 'Vintage Wash Oversized Female Tee', 'Chất cotton xử lý wash màu giả cổ, vai trễ cá tính và năng động', 'Soft vintage washed cotton with drop shoulder pattern'),
(19, 'Organic Crewneck Basic Tee', '100% combed organic cotton, ultra-soft and gentle on sensitive skin', 280000, 190000, '/public/images/ao-thun-vai-cotton-nu-white.png', 5, 'female', 'Áo Thun Nữ Cotton Hữu Cơ Cơ Bản', 'Organic Crewneck Basic Tee', '100% cotton hữu cơ chải kỹ, siêu mềm mịn không gây kích ứng da', '100% combed organic cotton, ultra-soft and gentle on sensitive skin'),
(20, 'V-Neck Feminine Slim Tee', 'Flattering V-neck cut crafted from breathable modal-cotton blend', 280000, 190000, '/public/images/ao-thun-vai-cotton-nu-black.png', 5, 'female', 'Áo Thun Nữ Cổ V Thanh Lịch', 'V-Neck Feminine Slim Tee', 'Đường cắt cổ V tinh tế từ chất liệu pha modal cao cấp siêu mát', 'Flattering V-neck cut crafted from breathable modal-cotton blend'),
(21, 'High-Waisted Tailored Gear Trouser', 'Structured pleats with high-rise waist for an elongated leg look', 450000, 310000, '/public/images/quan-dai-gear-nu-beige.png', 6, 'female', 'Quần Tây Nữ Cạp Cao Ống Rộng', 'High-Waisted Tailored Gear Trouser', 'Xếp ly chỉn chu cùng cạp cao giúp hack dáng chiều cao hiệu quả', 'Structured pleats with high-rise waist for an elongated leg look'),
(22, 'Ankle-Length Stretch Smart Pants', 'Cropped hem above ankles, perfect for heels or casual sneakers', 450000, 310000, '/public/images/quan-dai-gear-nu-green.png', 6, 'female', 'Quần Dài Nữ Ôm Cổ Chân Co Giãn', 'Ankle-Length Stretch Smart Pants', 'Chiều dài chạm cổ chân hiện đại, dễ kết hợp với giày cao gót hoặc sneaker', 'Cropped hem above ankles, perfect for heels or casual sneakers'),
(23, 'Cozy Wide-Leg Knit Lounge Pants', 'Soft breathable ribbed knit with elasticized drawstring waistband', 450000, 310000, '/public/images/quan-det-kim-nu-gray.png', 6, 'female', 'Quần Dệt Kim Nữ Ống Suông Thoải Mái', 'Cozy Wide-Leg Knit Lounge Pants', 'Chất dệt kim mềm mại, cạp thun dây rút thoải mái khi đi chơi hay ở nhà', 'Soft breathable ribbed knit with elasticized drawstring waistband'),
(24, 'Straight-Cut Minimalist Suit Pants', 'Wrinkle-resistant fabric with clean crease line down the center', 450000, 310000, '/public/images/quan-det-kim-nu-khaki.png', 6, 'female', 'Quần Tây Nữ Dáng Đứng Tối Giản', 'Straight-Cut Minimalist Suit Pants', 'Vải đứng phom chống nhăn, nếp ly giữa tinh tế tạo nét chỉn chu công sở', 'Wrinkle-resistant fabric with clean crease line down the center'),
(25, 'Heavyweight Streetwear Unisex Tee', '280gsm combed cotton jersey, structured drop-shoulder fit', 200000, 140000, '/public/images/ao-thun-tay-ngan-unisex-gray.png', 7, 'unisex', 'Áo Thun Unisex Phố Thị Dày Dặn', 'Heavyweight Streetwear Unisex Tee', 'Cotton 280gsm dày dặn đứng phom, dáng xuông vai trễ cá tính chuẩn streetwear', '280gsm combed cotton jersey, structured drop-shoulder fit'),
(26, 'Breathable Athletic Performance Tee', 'Quick-dry honeycomb mesh fabric for workouts and daily activities', 200000, 140000, '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png', 7, 'unisex', 'Áo Thun Unisex Thể Thao Thoáng Khí', 'Breathable Athletic Performance Tee', 'Vải dệt lưới tổ ong thấm hút và khô nhanh, lý tưởng cho tập luyện và vận động', 'Quick-dry honeycomb mesh fabric for workouts and daily activities'),
(27, 'Long-Sleeve Ribbed Collar Unisex Tee', 'Classic long sleeve layout with durable rib-knit cuffs and neckband', 200000, 140000, '/public/images/ao-thun-tay-dai-unisex-blue.png', 7, 'unisex', 'Áo Thun Tay Dài Unisex Bo Cổ', 'Long-Sleeve Ribbed Collar Unisex Tee', 'Áo tay dài cổ bo gân bền đẹp, chất vải mềm mại cho những ngày se lạnh', 'Classic long sleeve layout with durable rib-knit cuffs and neckband'),
(28, 'Graphic Art Boxy Fit Unisex Tee', 'Boxy streetwear silhouette with clean finished hems', 200000, 140000, '/public/images/ao-thun-tay-dai-unisex-green.png', 7, 'unisex', 'Áo Thun Unisex Boxy Fit Độc Đáo', 'Graphic Art Boxy Fit Unisex Tee', 'Form boxy vuông vức cá tính, đường may cẩn thận từng chi tiết', 'Boxy streetwear silhouette with clean finished hems'),
(29, 'Drawstring Cargo Pocket Track Pants', 'Functional side cargo pockets with toggle drawstring cuffs', 250000, 170000, '/public/images/quan-dai-unisex-beige.png', 8, 'unisex', 'Quần Dài Unisex Túi Hộp Năng Động', 'Drawstring Cargo Pocket Track Pants', 'Túi hộp 2 bên tiện lợi, bo gấu rút dây biến tấu phong cách dễ dàng', 'Functional side cargo pockets with toggle drawstring cuffs'),
(30, 'Relaxed Canvas Workwear Trousers', 'Heavy duty cotton canvas build for ultimate durability', 250000, 170000, '/public/images/quan-dai-unisex-green.png', 8, 'unisex', 'Quần Dài Unisex Vải Canvas Bền Bỉ', 'Relaxed Canvas Workwear Trousers', 'Chất liệu canvas cotton siêu bền, phù hợp mọi hoạt động di chuyển', 'Heavy duty cotton canvas build for ultimate durability'),
(31, 'Loose-Fit Washed Unisex Jeans', 'Relaxed leg silhouette with distressed vintage fade processing', 250000, 170000, '/public/images/quan-jean-unisex-blue.png', 8, 'unisex', 'Quần Jean Unisex Form Rộng Wash Sáng', 'Loose-Fit Washed Unisex Jeans', 'Form rộng thoải mái với mảng wash màu khói tự nhiên cực chất', 'Relaxed leg silhouette with distressed vintage fade processing'),
(32, 'Straight Leg Black Denim Unisex Jeans', 'Deep black dyed denim that keeps its rich tone wash after wash', 250000, 170000, '/public/images/quan-jean-unisex-black.png', 8, 'unisex', 'Quần Jean Unisex Đen Dáng Đứng', 'Straight Leg Black Denim Unisex Jeans', 'Tone màu đen tuyền giữ màu lâu, dễ dàng mix-match với mọi loại trang phục', 'Deep black dyed denim that keeps its rich tone wash after wash'),
(33, 'French Terry Elastic Sweat Shorts', 'Breathable loopback French terry with deep side slash pockets', 250000, 170000, '/public/images/quan-short-unisex-gray.png', 9, 'unisex', 'Quần Short Unisex Nỉ Da Cá Nhẹ Nhàng', 'French Terry Elastic Sweat Shorts', 'Chất nỉ da cá thoáng mát, túi xéo sâu chứa đồ thoải mái', 'Breathable loopback French terry with deep side slash pockets'),
(34, 'Quick-Dry Nylon Summer Shorts', 'Water-repellent lightweight nylon, built for beach and summer casual', 250000, 170000, '/public/images/quan-short-unisex-white.png', 9, 'unisex', 'Quần Short Unisex Nylon Khô Nhanh', 'Quick-Dry Nylon Summer Shorts', 'Chất nylon trượt nước nhẹ, khô nhanh thích hợp dạo phố hay đi biển', 'Water-repellent lightweight nylon, built for beach and summer casual'),
(35, 'Utility Multi-Pocket Trail Shorts', 'Built-in adjustable webbing belt and durable ripstop fabric', 250000, 170000, '/public/images/quan-short-unisex-green.png', 9, 'unisex', 'Quần Short Unisex Túi Hộp Đa Năng', 'Utility Multi-Pocket Trail Shorts', 'Đi kèm đai lưng dệt tiện lợi cùng chất liệu ripstop chống xé', 'Built-in adjustable webbing belt and durable ripstop fabric'),
(36, 'Classic Cotton Twill Shorts', 'Tailored 7-inch inseam shorts with clean button closure', 250000, 170000, '/public/images/quan-short-unisex-navy.png', 9, 'unisex', 'Quần Short Unisex Cotton Twill Cổ Điển', 'Classic Cotton Twill Shorts', 'Chiều dài 7 inch vừa phải, chất vải twill mềm mịn thoải mái', 'Tailored 7-inch inseam shorts with clean button closure');

-- ============================================================
-- 5. SEED PRODUCT COLORS
-- ============================================================
INSERT INTO product_colors (id, product_id, color_name, color_code, image_url, color_name_vi, color_name_en) VALUES
(1, 1, 'White', '#FFFFFF', '/public/images/ao-so-mi-nam-white.png', 'Trắng', 'White'),
(2, 1, 'Sky Blue', '#87CEEB', '/public/images/ao-so-mi-nam-blue.png', 'Xanh Da Trời', 'Sky Blue'),
(3, 2, 'White', '#FFFFFF', '/public/images/ao-so-mi-nam-white.png', 'Trắng', 'White'),
(4, 2, 'Sky Blue', '#87CEEB', '/public/images/ao-so-mi-nam-blue.png', 'Xanh Da Trời', 'Sky Blue'),
(5, 3, 'Beige', '#C3B091', '/public/images/ao-so-mi-nam-beige.png', 'Be', 'Beige'),
(6, 3, 'Black', '#000000', '/public/images/ao-so-mi-nam-black.png', 'Đen', 'Black'),
(7, 4, 'Beige', '#C3B091', '/public/images/ao-so-mi-nam-beige.png', 'Be', 'Beige'),
(8, 4, 'Black', '#000000', '/public/images/ao-so-mi-nam-black.png', 'Đen', 'Black'),
(9, 5, 'Beige', '#F5F5DC', '/public/images/quan-chino-nam-beige.png', 'Be', 'Beige'),
(10, 5, 'Blue', '#0000FF', '/public/images/quan-chino-nam-blue.png', 'Xanh Dương', 'Blue'),
(11, 6, 'Beige', '#F5F5DC', '/public/images/quan-chino-nam-beige.png', 'Be', 'Beige'),
(12, 6, 'Blue', '#0000FF', '/public/images/quan-chino-nam-blue.png', 'Xanh Dương', 'Blue'),
(13, 7, 'Light Blue', '#e5ecf6', '/public/images/quan-jean-nam-light-blue.png', 'Xanh Nhạt', 'Light Blue'),
(14, 7, 'Dark Gray', '#232227', '/public/images/quan-jean-nam-dark-gray.png', 'Xám Đậm', 'Dark Gray'),
(15, 8, 'Light Blue', '#e5ecf6', '/public/images/quan-jean-nam-light-blue.png', 'Xanh Nhạt', 'Light Blue'),
(16, 8, 'Dark Gray', '#232227', '/public/images/quan-jean-nam-dark-gray.png', 'Xám Đậm', 'Dark Gray'),
(17, 9, 'Green', '#6f7c6b', '/public/images/ao-hoodie-nam-green.png', 'Xanh Lá', 'Green'),
(18, 9, 'Red', '#d74d55', '/public/images/ao-hoodie-nam-red.png', 'Đỏ', 'Red'),
(19, 10, 'Green', '#6f7c6b', '/public/images/ao-hoodie-nam-green.png', 'Xanh Lá', 'Green'),
(20, 10, 'Red', '#d74d55', '/public/images/ao-hoodie-nam-red.png', 'Đỏ', 'Red'),
(21, 11, 'Blue', '#007bff', '/public/images/ao-khoac-nam-blue.png', 'Xanh Dương', 'Blue'),
(22, 11, 'Yellow', '#d4a017', '/public/images/ao-khoac-nam-yellow.png', 'Vàng', 'Yellow'),
(23, 12, 'Blue', '#007bff', '/public/images/ao-khoac-nam-blue.png', 'Xanh Dương', 'Blue'),
(24, 12, 'Yellow', '#d4a017', '/public/images/ao-khoac-nam-yellow.png', 'Vàng', 'Yellow'),
(25, 13, 'White', '#FFFFFF', '/public/images/ao-so-mi-nu-white.png', 'Trắng', 'White'),
(26, 13, 'Green', '#A9E5BB', '/public/images/ao-so-mi-nu-green.png', 'Xanh Lá', 'Green'),
(27, 14, 'White', '#FFFFFF', '/public/images/ao-so-mi-nu-white.png', 'Trắng', 'White'),
(28, 14, 'Green', '#A9E5BB', '/public/images/ao-so-mi-nu-green.png', 'Xanh Lá', 'Green'),
(29, 15, 'White', '#FFFFFF', '/public/images/ao-so-mi-nu-ke-soc-white.png', 'Trắng', 'White'),
(30, 15, 'Sky Blue', '#87CEEB', '/public/images/ao-so-mi-nu-ke-soc-blue.png', 'Xanh Da Trời', 'Sky Blue'),
(31, 16, 'White', '#FFFFFF', '/public/images/ao-so-mi-nu-ke-soc-white.png', 'Trắng', 'White'),
(32, 16, 'Sky Blue', '#87CEEB', '/public/images/ao-so-mi-nu-ke-soc-blue.png', 'Xanh Da Trời', 'Sky Blue'),
(33, 17, 'Sky Blue', '#dce2f0', '/public/images/ao-thun-co-tron-nu-blue.png', 'Xanh Da Trời', 'Sky Blue'),
(34, 17, 'Navy', '#2b3b5d', '/public/images/ao-thun-co-tron-nu-navy.png', 'Xanh Navy', 'Navy'),
(35, 18, 'Sky Blue', '#dce2f0', '/public/images/ao-thun-co-tron-nu-blue.png', 'Xanh Da Trời', 'Sky Blue'),
(36, 18, 'Navy', '#2b3b5d', '/public/images/ao-thun-co-tron-nu-navy.png', 'Xanh Navy', 'Navy'),
(37, 19, 'White', '#FFFFFF', '/public/images/ao-thun-vai-cotton-nu-white.png', 'Trắng', 'White'),
(38, 19, 'Black', '#000000', '/public/images/ao-thun-vai-cotton-nu-black.png', 'Đen', 'Black'),
(39, 20, 'White', '#FFFFFF', '/public/images/ao-thun-vai-cotton-nu-white.png', 'Trắng', 'White'),
(40, 20, 'Black', '#000000', '/public/images/ao-thun-vai-cotton-nu-black.png', 'Đen', 'Black'),
(41, 21, 'Beige', '#F5F5DC', '/public/images/quan-dai-gear-nu-beige.png', 'Be', 'Beige'),
(42, 21, 'Dark Green', '#0A3D3B', '/public/images/quan-dai-gear-nu-green.png', 'Xanh Đậm', 'Dark Green'),
(43, 22, 'Beige', '#F5F5DC', '/public/images/quan-dai-gear-nu-beige.png', 'Be', 'Beige'),
(44, 22, 'Dark Green', '#0A3D3B', '/public/images/quan-dai-gear-nu-green.png', 'Xanh Đậm', 'Dark Green'),
(45, 23, 'Beige', '#b6a498', '/public/images/quan-det-kim-nu-khaki.png', 'Be', 'Beige'),
(46, 23, 'Gray', '#515055', '/public/images/quan-det-kim-nu-gray.png', 'Xám', 'Gray'),
(47, 24, 'Beige', '#b6a498', '/public/images/quan-det-kim-nu-khaki.png', 'Be', 'Beige'),
(48, 24, 'Gray', '#515055', '/public/images/quan-det-kim-nu-gray.png', 'Xám', 'Gray'),
(49, 25, 'Gray', '#c0c8d3', '/public/images/ao-thun-tay-ngan-unisex-gray.png', 'Xám', 'Gray'),
(50, 25, 'Dark Gray', '#474b4e', '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png', 'Xám Đậm', 'Dark Gray'),
(51, 26, 'Gray', '#c0c8d3', '/public/images/ao-thun-tay-ngan-unisex-gray.png', 'Xám', 'Gray'),
(52, 26, 'Dark Gray', '#474b4e', '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png', 'Xám Đậm', 'Dark Gray'),
(53, 27, 'Dark Blue', '#2c3546', '/public/images/ao-thun-tay-dai-unisex-blue.png', 'Xanh Đậm', 'Dark Blue'),
(54, 27, 'Light Green', '#b3b6af', '/public/images/ao-thun-tay-dai-unisex-green.png', 'Xanh Lá Nhạt', 'Light Green'),
(55, 28, 'Dark Blue', '#2c3546', '/public/images/ao-thun-tay-dai-unisex-blue.png', 'Xanh Đậm', 'Dark Blue'),
(56, 28, 'Light Green', '#b3b6af', '/public/images/ao-thun-tay-dai-unisex-green.png', 'Xanh Lá Nhạt', 'Light Green'),
(57, 29, 'Green', '#5a6151', '/public/images/quan-dai-unisex-green.png', 'Xanh Lá', 'Green'),
(58, 29, 'Beige', '#cab99f', '/public/images/quan-dai-unisex-beige.png', 'Be', 'Beige'),
(59, 30, 'Green', '#5a6151', '/public/images/quan-dai-unisex-green.png', 'Xanh Lá', 'Green'),
(60, 30, 'Beige', '#cab99f', '/public/images/quan-dai-unisex-beige.png', 'Be', 'Beige'),
(61, 31, 'Blue', '#1B4F72', '/public/images/quan-jean-unisex-blue.png', 'Xanh Dương', 'Blue'),
(62, 31, 'Black', '#333333', '/public/images/quan-jean-unisex-black.png', 'Đen', 'Black'),
(63, 32, 'Blue', '#1B4F72', '/public/images/quan-jean-unisex-blue.png', 'Xanh Dương', 'Blue'),
(64, 32, 'Black', '#333333', '/public/images/quan-jean-unisex-black.png', 'Đen', 'Black'),
(65, 33, 'White', '#f1f0ee', '/public/images/quan-short-unisex-white.png', 'Trắng', 'White'),
(66, 33, 'Gray', '#646b7d', '/public/images/quan-short-unisex-gray.png', 'Xám', 'Gray'),
(67, 34, 'White', '#f1f0ee', '/public/images/quan-short-unisex-white.png', 'Trắng', 'White'),
(68, 34, 'Gray', '#646b7d', '/public/images/quan-short-unisex-gray.png', 'Xám', 'Gray'),
(69, 35, 'Green', '#696C52', '/public/images/quan-short-unisex-green.png', 'Xanh Lá', 'Green'),
(70, 35, 'Navy', '#2C3243', '/public/images/quan-short-unisex-navy.png', 'Xanh Navy', 'Navy'),
(71, 36, 'Green', '#696C52', '/public/images/quan-short-unisex-green.png', 'Xanh Lá', 'Green'),
(72, 36, 'Navy', '#2C3243', '/public/images/quan-short-unisex-navy.png', 'Xanh Navy', 'Navy');

-- ============================================================
-- 6. SEED PRODUCT SIZES
-- ============================================================
INSERT INTO product_sizes (color_id, size, stock) VALUES
(1, 'S', 10),(1, 'M', 20),(1, 'L', 15),
(2, 'S', 8),(2, 'M', 18),(2, 'L', 12),
(3, 'S', 10),(3, 'M', 15),(3, 'L', 12),
(4, 'S', 5),(4, 'M', 8),(4, 'L', 10),
(5, 'S', 10),(5, 'M', 8),(5, 'L', 5),
(6, 'S', 12),(6, 'M', 10),(6, 'L', 6),
(7, 'S', 7),(7, 'M', 14),(7, 'L', 9),
(8, 'S', 6),(8, 'M', 12),(8, 'L', 8),
(9, 'S', 15),(9, 'M', 20),(9, 'L', 10),
(10, 'S', 12),(10, 'M', 18),(10, 'L', 10),
(11, 'S', 10),(11, 'M', 15),(11, 'L', 12),
(12, 'S', 8),(12, 'M', 12),(12, 'L', 10),
(13, 'S', 10),(13, 'M', 20),(13, 'L', 15),
(14, 'S', 8),(14, 'M', 18),(14, 'L', 12),
(15, 'S', 8),(15, 'M', 15),(15, 'L', 12),
(16, 'S', 6),(16, 'M', 12),(16, 'L', 10),
(17, 'S', 10),(17, 'M', 15),(17, 'L', 10),
(18, 'S', 8),(18, 'M', 14),(18, 'L', 12),
(19, 'S', 7),(19, 'M', 14),(19, 'L', 10),
(20, 'S', 5),(20, 'M', 10),(20, 'L', 8),
(21, 'S', 10),(21, 'M', 15),(21, 'L', 12),
(22, 'S', 8),(22, 'M', 12),(22, 'L', 10),
(23, 'S', 12),(23, 'M', 10),(23, 'L', 8),
(24, 'S', 10),(24, 'M', 14),(24, 'L', 10),
(25, 'S', 10),(25, 'M', 20),(25, 'L', 15),
(26, 'S', 8),(26, 'M', 18),(26, 'L', 12),
(27, 'S', 10),(27, 'M', 15),(27, 'L', 12),
(28, 'S', 5),(28, 'M', 8),(28, 'L', 10),
(29, 'S', 10),(29, 'M', 8),(29, 'L', 5),
(30, 'S', 12),(30, 'M', 10),(30, 'L', 6),
(31, 'S', 7),(31, 'M', 14),(31, 'L', 9),
(32, 'S', 6),(32, 'M', 12),(32, 'L', 8),
(33, 'S', 15),(33, 'M', 20),(33, 'L', 10),
(34, 'S', 12),(34, 'M', 18),(34, 'L', 10),
(35, 'S', 10),(35, 'M', 15),(35, 'L', 12),
(36, 'S', 8),(36, 'M', 12),(36, 'L', 10),
(37, 'S', 10),(37, 'M', 20),(37, 'L', 15),
(38, 'S', 8),(38, 'M', 18),(38, 'L', 12),
(39, 'S', 10),(39, 'M', 15),(39, 'L', 12),
(40, 'S', 5),(40, 'M', 8),(40, 'L', 10),
(41, 'S', 10),(41, 'M', 8),(41, 'L', 5),
(42, 'S', 12),(42, 'M', 10),(42, 'L', 6),
(43, 'S', 7),(43, 'M', 14),(43, 'L', 9),
(44, 'S', 6),(44, 'M', 12),(44, 'L', 8),
(45, 'S', 15),(45, 'M', 20),(45, 'L', 10),
(46, 'S', 12),(46, 'M', 18),(46, 'L', 10),
(47, 'S', 10),(47, 'M', 15),(47, 'L', 12),
(48, 'S', 8),(48, 'M', 12),(48, 'L', 10),
(49, 'S', 10),(49, 'M', 20),(49, 'L', 15),
(50, 'S', 8),(50, 'M', 18),(50, 'L', 12),
(51, 'S', 8),(51, 'M', 15),(51, 'L', 12),
(52, 'S', 6),(52, 'M', 12),(52, 'L', 10),
(53, 'S', 10),(53, 'M', 15),(53, 'L', 10),
(54, 'S', 8),(54, 'M', 14),(54, 'L', 12),
(55, 'S', 7),(55, 'M', 14),(55, 'L', 10),
(56, 'S', 5),(56, 'M', 10),(56, 'L', 8),
(57, 'S', 10),(57, 'M', 15),(57, 'L', 12),
(58, 'S', 8),(58, 'M', 12),(58, 'L', 10),
(59, 'S', 12),(59, 'M', 10),(59, 'L', 8),
(60, 'S', 10),(60, 'M', 14),(60, 'L', 10),
(61, 'S', 10),(61, 'M', 20),(61, 'L', 15),
(62, 'S', 8),(62, 'M', 18),(62, 'L', 12),
(63, 'S', 10),(63, 'M', 15),(63, 'L', 12),
(64, 'S', 5),(64, 'M', 8),(64, 'L', 10),
(65, 'S', 10),(65, 'M', 8),(65, 'L', 5),
(66, 'S', 12),(66, 'M', 10),(66, 'L', 6),
(67, 'S', 7),(67, 'M', 14),(67, 'L', 9),
(68, 'S', 6),(68, 'M', 12),(68, 'L', 8),
(69, 'S', 15),(69, 'M', 20),(69, 'L', 10),
(70, 'S', 12),(70, 'M', 18),(70, 'L', 10),
(71, 'S', 10),(71, 'M', 15),(71, 'L', 12),
(72, 'S', 8),(72, 'M', 12),(72, 'L', 10);

-- ============================================================
-- 7. SEED BANNERS
-- ============================================================
INSERT INTO banners (id, image_url, title, subtitle, title_vi, title_en, subtitle_vi, subtitle_en) VALUES
(1, '/public/images/banner1.png', 'WELCOME TO LOOM', 'Nhập mã LOOM10 giảm ngay 10% cho đơn hàng đầu tiên từ 300k!', 'Chào Mừng Đến Với LOOM', 'Welcome to LOOM', 'Nhập mã LOOM10 giảm ngay 10% cho đơn hàng đầu tiên từ 300k!', 'Use code LOOM10 for 10% off your first order from 300k!'),
(2, '/public/images/banner2.png', 'LOOM SUMMER GRAND SALE', 'Giảm giá lên đến 20% cho toàn bộ các sản phẩm Áo & Quần!', 'Đại Tiệc Ưu Đãi Mùa Hè - LOOM', 'LOOM Summer Grand Sale', 'Giảm giá lên đến 20% cho toàn bộ các sản phẩm Áo & Quần!', 'Up to 20% off on all Shirts, T-shirts, Pants & Shorts!'),
(3, '/public/images/banner3.png', 'MUA 2 TẶNG 1 ĐẶC BIỆT', 'Thêm 2 Áo Thun bất kỳ vào giỏ hàng để nhận ngay 1 Quần Short cao cấp!', 'Ưu Đãi Mua 2 Áo Thun Tặng 1 Quần Short', 'Buy 2 T-shirts Get 1 Short Free', 'Thêm 2 Áo Thun bất kỳ vào giỏ hàng để nhận ngay 1 Quần Short cao cấp!', 'Buy any 2 T-shirts and receive 1 Premium Short for free!'),
(4, '/public/images/banner4.png', 'ĐẶC QUYỀN HỘI VIÊN LOOM VIP', 'Tích điểm nâng hạng Bạc/Vàng/Kim Cương – Giảm thêm lên đến 20%!', 'Đặc Quyền Nâng Hạng Hội Viên VIP', 'LOOM VIP Membership Rewards', 'Tích điểm nâng hạng Bạc/Vàng/Kim Cương – Giảm thêm lên đến 20% khi thanh toán!', 'Upgrade to Silver/Gold/Diamond for up to 20% extra discount!');

-- ============================================================
-- 8. SEED SALES
-- ============================================================
INSERT INTO sales (id, name, name_vi, name_en, discount_percent, apply_scope, start_date, end_date, status) VALUES
(1, 'LOOM Summer Sale 2025', 'Đại Tiệc Sale Mùa Hè LOOM 2025', 'LOOM Summer Grand Sale 2025', 20.00, 'all', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY), 1);

-- ============================================================
-- 9. SEED VOUCHERS
-- ============================================================
INSERT INTO vouchers (id, code, description_vi, description_en, discount_percent, max_discount_amount, min_order_value, usage_limit, used_count, start_date, end_date, status, apply_scope) VALUES
(1, 'LOOM10', 'Giảm 10% tối đa 50.000đ cho đơn hàng từ 300.000đ', '10% off up to 50k for orders from 300k', 10.00, 50000.00, 300000.00, 100, 15, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 1, 'all');

-- ============================================================
-- 10. SEED PROMOTIONS (BUY X GET Y)
-- ============================================================
INSERT INTO buy_x_get_y_promotions (id, name, name_vi, name_en, description_vi, description_en, buy_product_id, buy_quantity, gift_product_id, gift_quantity, start_date, end_date, max_gift_per_order, total_gift_limit, priority, is_stackable, status, is_active) VALUES
(1, 'Buy 2 T-Shirts Get 1 Short Free', 'Mua 2 Áo Thun Unisex Tặng 1 Quần Short', 'Buy 2 Unisex T-shirts Get 1 Short Free', 'Mua 2 Áo Thun Unisex Phố Thị (ID 25) nhận ngay 1 Quần Short Nỉ Da Cá (ID 33) miễn phí', 'Buy 2 Heavyweight Streetwear Unisex Tees (ID 25) get 1 French Terry Sweat Short (ID 33) free', 25, 2, 33, 1, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 45 DAY), 2, 50, 1, 1, 'active', 1);

-- ============================================================
-- 11. SEED ORDERS & ORDER ITEMS
-- ============================================================
INSERT INTO orders (id, name, email, phone, address, total_price, status, payment_status, created_at, delivered_at) VALUES
(201, 'Ngày 01', 'ngay01@test.com', '0900000001', 'Hà Nội', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 1 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 1 DAY),
(202, 'Ngày 02', 'ngay02@test.com', '0900000002', 'TP HCM', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 2 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 2 DAY),
(203, 'Ngày 03', 'ngay03@test.com', '0900000003', 'Đà Nẵng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 3 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 3 DAY),
(204, 'Ngày 04', 'ngay04@test.com', '0900000004', 'Cần Thơ', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 4 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 4 DAY),
(205, 'Ngày 05', 'ngay05@test.com', '0900000005', 'Hải Phòng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 5 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 5 DAY),
(206, 'Ngày 06', 'ngay06@test.com', '0900000006', 'Nha Trang', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 6 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 6 DAY),
(207, 'Ngày 07', 'ngay07@test.com', '0900000007', 'Huế', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 7 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 7 DAY),
(208, 'Ngày 08', 'ngay08@test.com', '0900000008', 'Hà Nội', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 8 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 8 DAY),
(209, 'Ngày 09', 'ngay09@test.com', '0900000009', 'TP HCM', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 9 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 9 DAY),
(210, 'Ngày 10', 'ngay10@test.com', '0900000010', 'Đà Nẵng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 10 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 10 DAY),
(211, 'Ngày 11', 'ngay11@test.com', '0900000011', 'Cần Thơ', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 11 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 11 DAY),
(212, 'Ngày 12', 'ngay12@test.com', '0900000012', 'Hải Phòng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 12 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 12 DAY),
(213, 'Ngày 13', 'ngay13@test.com', '0900000013', 'Nha Trang', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 13 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 13 DAY),
(214, 'Ngày 14', 'ngay14@test.com', '0900000014', 'Huế', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 14 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 14 DAY),
(215, 'Ngày 15', 'ngay15@test.com', '0900000015', 'Hà Nội', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 15 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 15 DAY),
(216, 'Ngày 16', 'ngay16@test.com', '0900000016', 'TP HCM', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 16 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 16 DAY),
(217, 'Ngày 17', 'ngay17@test.com', '0900000017', 'Đà Nẵng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 17 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 17 DAY),
(218, 'Ngày 18', 'ngay18@test.com', '0900000018', 'Cần Thơ', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 18 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 18 DAY),
(219, 'Ngày 19', 'ngay19@test.com', '0900000019', 'Hải Phòng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 19 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 19 DAY),
(220, 'Ngày 20', 'ngay20@test.com', '0900000020', 'Nha Trang', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 20 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 20 DAY),
(221, 'Ngày 21', 'ngay21@test.com', '0900000021', 'Huế', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 21 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 21 DAY),
(222, 'Ngày 22', 'ngay22@test.com', '0900000022', 'Hà Nội', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 22 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 22 DAY),
(223, 'Ngày 23', 'ngay23@test.com', '0900000023', 'TP HCM', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 23 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 23 DAY),
(224, 'Ngày 24', 'ngay24@test.com', '0900000024', 'Đà Nẵng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 24 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 24 DAY),
(225, 'Ngày 25', 'ngay25@test.com', '0900000025', 'Cần Thơ', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 25 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 25 DAY),
(226, 'Ngày 26', 'ngay26@test.com', '0900000026', 'Hải Phòng', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 26 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 26 DAY),
(227, 'Ngày 27', 'ngay27@test.com', '0900000027', 'Nha Trang', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 27 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 27 DAY),
(228, 'Ngày 28', 'ngay28@test.com', '0900000028', 'Huế', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 28 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 28 DAY),
(229, 'Ngày 29', 'ngay29@test.com', '0900000029', 'Hà Nội', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 29 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 29 DAY),
(230, 'Ngày 30', 'ngay30@test.com', '0900000030', 'TP HCM', 0, 'Delivered', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 30 DAY, DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 30 DAY),
(301, 'Tháng 01', 'thang01@test.com', '0900000031', 'Hà Nội', 0, 'Return Requested', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 12 MONTH), '%Y-%m-15 12:00:00')),
(302, 'Tháng 02', 'thang02@test.com', '0900000032', 'TP HCM', 0, 'Return Requested', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-15 12:00:00')),
(303, 'Tháng 03', 'thang03@test.com', '0900000033', 'Đà Nẵng', 0, 'Return Requested', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 10 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 10 MONTH), '%Y-%m-15 12:00:00')),
(304, 'Tháng 04', 'thang04@test.com', '0900000034', 'Cần Thơ', 0, 'Return Requested', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 9 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 9 MONTH), '%Y-%m-15 12:00:00')),
(305, 'Tháng 05', 'thang05@test.com', '0900000035', 'Hải Phòng', 0, 'Return Approved', 'Refunded', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 8 MONTH), '%Y-%m-15 12:00:00')),
(306, 'Tháng 06', 'thang06@test.com', '0900000036', 'Nha Trang', 0, 'Return Approved', 'Refunded', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 MONTH), '%Y-%m-15 12:00:00')),
(307, 'Tháng 07', 'thang07@test.com', '0900000037', 'Huế', 0, 'Return Approved', 'Refunded', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 6 MONTH), '%Y-%m-15 12:00:00')),
(308, 'Tháng 08', 'thang08@test.com', '0900000038', 'Hà Nội', 0, 'Return Approved', 'Refunded', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m-15 12:00:00')),
(309, 'Tháng 09', 'thang09@test.com', '0900000039', 'TP HCM', 0, 'Return Rejected', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 4 MONTH), '%Y-%m-15 12:00:00')),
(310, 'Tháng 10', 'thang10@test.com', '0900000040', 'Đà Nẵng', 0, 'Return Rejected', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH), '%Y-%m-15 12:00:00')),
(311, 'Tháng 11', 'thang11@test.com', '0900000049', 'Cần Thơ', 0, 'Return Rejected', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 2 MONTH), '%Y-%m-15 12:00:00')),
(312, 'Tháng 12', 'thang12@test.com', '0900000050', 'Hải Phòng', 0, 'Return Rejected', 'Paid', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-15 12:00:00'), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-15 12:00:00')),
(401, 'Pending 1', 'pending01@test.com', '0900000041', 'Hà Nội', 0, 'Pending', 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 1 DAY, NULL),
(402, 'Pending 2', 'pending02@test.com', '0900000042', 'TP HCM', 0, 'Pending', 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 2 DAY, NULL),
(403, 'Confirmed 1', 'confirmed01@test.com', '0900000043', 'Đà Nẵng', 0, 'Confirmed', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 2 DAY, NULL),
(404, 'Confirmed 2', 'confirmed02@test.com', '0900000044', 'Cần Thơ', 0, 'Confirmed', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 3 DAY, NULL),
(405, 'Shipping 1', 'shipping01@test.com', '0900000045', 'Hải Phòng', 0, 'Shipping', 'Paid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 3 DAY, NULL),
(406, 'Shipping 2', 'shipping02@test.com', '0900000046', 'Nha Trang', 0, 'Shipping', 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 4 DAY, NULL),
(407, 'Cancelled 1', 'cancelled01@test.com', '0900000047', 'Huế', 0, 'Cancelled', 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 4 DAY, NULL),
(408, 'Cancelled 2', 'cancelled02@test.com', '0900000048', 'Hà Nội', 0, 'Cancelled', 'Unpaid', DATE_ADD(CURDATE(), INTERVAL 12 HOUR) - INTERVAL 5 DAY, NULL);

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(201, 1, 2, 150000),
(202, 5, 2, 320000),
(203, 9, 3, 150000),
(204, 33, 2, 250000),
(205, 25, 3, 200000),
(206, 1, 4, 150000),
(207, 9, 3, 150000),
(208, 1, 3, 150000),
(209, 25, 2, 200000),
(210, 9, 4, 150000),
(211, 5, 2, 320000),
(212, 33, 3, 250000),
(213, 1, 5, 150000),
(214, 25, 2, 200000),
(215, 9, 2, 150000),
(216, 33, 2, 250000),
(217, 5, 1, 320000),
(218, 1, 4, 150000),
(219, 25, 4, 200000),
(220, 9, 2, 150000),
(221, 1, 3, 150000),
(222, 25, 2, 200000),
(223, 33, 1, 250000),
(224, 5, 2, 320000),
(225, 1, 4, 150000),
(226, 9, 3, 150000),
(227, 25, 3, 200000),
(228, 33, 2, 250000),
(229, 5, 1, 320000),
(230, 1, 2, 150000),
(301, 1, 6, 150000),
(302, 5, 4, 320000),
(303, 1, 10, 150000),
(304, 25, 8, 200000),
(305, 33, 10, 250000),
(306, 33, 10, 250000),
(307, 25, 12, 200000),
(308, 5, 8, 320000),
(309, 1, 12, 150000),
(310, 9, 8, 150000),
(311, 9, 12, 150000),
(312, 5, 10, 320000),
(401, 1, 1, 150000),
(402, 25, 1, 200000),
(403, 5, 1, 320000),
(404, 9, 2, 150000),
(405, 33, 1, 250000),
(406, 1, 2, 150000),
(407, 25, 1, 200000),
(408, 9, 1, 150000);

UPDATE orders o SET total_price = (SELECT SUM(quantity * price) FROM order_items WHERE order_id = o.id);

-- ============================================================
-- 12. SEED RETURN REQUESTS
-- ============================================================
INSERT INTO return_requests (order_id, reason_code, status) VALUES
(301, 'Damaged', 'Pending'),
(302, 'Wrong item', 'Pending'),
(303, 'Change mind', 'Pending'),
(304, 'Not as described', 'Pending'),
(305, 'Damaged', 'Approved'),
(306, 'Wrong item', 'Approved'),
(307, 'Change mind', 'Approved'),
(308, 'Not as described', 'Approved'),
(309, 'Damaged', 'Rejected'),
(310, 'Wrong item', 'Rejected'),
(311, 'Change mind', 'Rejected'),
(312, 'Not as described', 'Rejected');

-- ============================================================
-- 13. SEED USER PRODUCT INTERACTIONS
-- ============================================================
INSERT INTO user_product_interaction (user_id, product_id, interaction_type) VALUES
(3, 1, 'view'), (3, 1, 'add_to_cart'), (3, 1, 'purchase'),
(3, 5, 'view'), (3, 5, 'purchase'),
(5, 1, 'view'), (5, 1, 'add_to_cart'),
(5, 2, 'purchase'),
(8, 1, 'view'), (8, 5, 'view'), (8, 9, 'view'),
(4, 13, 'purchase'), (4, 14, 'purchase'),
(4, 17, 'add_to_cart'),
(7, 13, 'purchase'), (7, 19, 'view'),
(9, 13, 'view'), (9, 14, 'view'), (9, 15, 'view'), (9, 16, 'view'),
(6, 25, 'purchase'), (6, 33, 'purchase'), (6, 26, 'view'),
(11, 25, 'purchase'), (11, 27, 'add_to_cart'),
(12, 33, 'purchase'), (12, 34, 'add_to_cart'),
(10, 2, 'view'), (10, 25, 'view'), (10, 31, 'add_to_cart'),
(11, 1, 'view'), (3, 25, 'view');