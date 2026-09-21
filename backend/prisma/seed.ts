import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Gender, UserRole, SizeEnum, InteractionType, ReturnStatus, OrderStatus, ApplyScope, PromotionStatus } from '../src/generated/prisma/client';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number, hour = 12): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  d.setDate(d.getDate() + n);
  return d;
}

function monthsAgoDay15(n: number): Date {
  // Seed chart 12 thang: giu 12h trua de tranh lech timezone
  // (00:00 VN = hom truoc theo gio UTC/MySQL -> roi nham cot chart).
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(15);
  return d;
}

async function main() {
  console.log('Bắt đầu seed...');

  // ============================================================
  // 0. CLEANUP
  // ============================================================
  await prisma.userProductInteraction.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotionUsageHistory.deleteMany();
  await prisma.buyXGetYPromotion.deleteMany();
  await prisma.productVoucher.deleteMany();
  await prisma.voucherCategory.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.productSale.deleteMany();
  await prisma.saleCategory.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.membership.deleteMany();
  console.log('✔ Cleaned up existing data');

  // ============================================================
  // 1. MEMBERSHIPS
  // ============================================================
  await prisma.membership.createMany({
    data: [
      { name: 'Normal', name_vi: 'Thường', name_en: 'Normal', min_spending: 0, discount_percent: 0 },
      { name: 'Bronze', name_vi: 'Đồng', name_en: 'Bronze', min_spending: 5000000, discount_percent: 5 },
      { name: 'Silver', name_vi: 'Bạc', name_en: 'Silver', min_spending: 10000000, discount_percent: 10 },
      { name: 'Gold', name_vi: 'Vàng', name_en: 'Gold', min_spending: 15000000, discount_percent: 15 },
      { name: 'Diamond', name_vi: 'Kim Cương', name_en: 'Diamond', min_spending: 20000000, discount_percent: 20 },
    ],
  });
  console.log('✔ Memberships');

  // ============================================================
  // 2. USERS
  // ============================================================
  const usersData = [
    { id: 3, name: 'Nguyễn Văn A', email: 'vana@example.com' },
    { id: 4, name: 'Trần Thị B', email: 'thib@example.com' },
    { id: 5, name: 'Lê Văn C', email: 'vanc@example.com' },
    { id: 6, name: 'Phạm Minh D', email: 'minhd@example.com' },
    { id: 7, name: 'Hoàng Lan E', email: 'lane@example.com' },
    { id: 8, name: 'Đỗ Hùng F', email: 'hungf@example.com' },
    { id: 9, name: 'Bùi Mai G', email: 'maig@example.com' },
    { id: 10, name: 'Ngô Quang H', email: 'quangh@example.com' },
    { id: 11, name: 'Vũ Hải I', email: 'haii@example.com' },
    { id: 12, name: 'Phan An K', email: 'ank@example.com' },
  ];

  const defaultUserPassword = await bcrypt.hash('password123', 10);
  for (const u of usersData) {
    await prisma.user.create({
      data: { id: u.id, name: u.name, email: u.email, password: defaultUserPassword, role: UserRole.customer },
    });
  }
  console.log('✔ Customer Users');

  const hashedAdminPassword = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@shop.com', phone: '0123456789', password: hashedAdminPassword, role: UserRole.admin },
  });
  console.log('✔ Admin User');

  // ============================================================
  // 3. CATEGORIES
  // ============================================================
  const categoriesData = [
    { id: 1, name: 'Shirt', name_vi: 'Áo Sơ Mi', name_en: 'Shirt', gender: Gender.male },
    { id: 2, name: 'Trousers/Pants', name_vi: 'Quần Dài', name_en: 'Trousers/Pants', gender: Gender.male },
    { id: 3, name: 'Jacket/Hoodie', name_vi: 'Áo Khoác', name_en: 'Jacket/Hoodie', gender: Gender.male },
    { id: 4, name: 'Shirt', name_vi: 'Áo Sơ Mi', name_en: 'Shirt', gender: Gender.female },
    { id: 5, name: 'T-shirt', name_vi: 'Áo Thun', name_en: 'T-shirt', gender: Gender.female },
    { id: 6, name: 'Trousers/Pants', name_vi: 'Quần Dài', name_en: 'Trousers/Pants', gender: Gender.female },
    { id: 7, name: 'T-shirt', name_vi: 'Áo Thun', name_en: 'T-shirt', gender: Gender.unisex },
    { id: 8, name: 'Trousers/Pants', name_vi: 'Quần Dài', name_en: 'Trousers/Pants', gender: Gender.unisex },
    { id: 9, name: 'Shorts', name_vi: 'Quần Short', name_en: 'Shorts', gender: Gender.unisex },
  ];

  for (const c of categoriesData) {
    await prisma.category.create({ data: c });
  }
  console.log('✔ Categories');

  // ============================================================
  // 4. PRODUCTS
  // ============================================================
  const productsData = [
    { id: 1, name: 'Premium Oxford Cotton Shirt', name_vi: 'Áo Sơ Mi Cotton Oxford Cao Cấp', name_en: 'Premium Oxford Cotton Shirt', description: 'High density Oxford cotton with button-down collar, perfect for business casual', description_vi: 'Chất liệu Oxford cotton dày dặn, cổ đơm nút lịch lãm phù hợp đi làm và đi chơi', description_en: 'High density Oxford cotton with button-down collar, perfect for business casual', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-white.png', category_id: 1, gender: Gender.male },
    { id: 2, name: 'Ultra-Lightweight Linen Shirt', name_vi: 'Áo Sơ Mi Linen Siêu Nhẹ', name_en: 'Ultra-Lightweight Linen Shirt', description: '100% natural linen, breathable and quick-drying for hot summer days', description_vi: '100% vải linen tự nhiên, thoáng khí và thấm hút cực tốt cho ngày hè', description_en: '100% natural linen, breathable and quick-drying for hot summer days', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-blue.png', category_id: 1, gender: Gender.male },
    { id: 3, name: 'Classic Business Formal Shirt', name_vi: 'Áo Sơ Mi Công Sở Classic', name_en: 'Classic Business Formal Shirt', description: 'Crisp spread collar, anti-wrinkle bamboo fabric for sharp office looks', description_vi: 'Áo cổ bẻ cứng cáp, vải sợi tre chống nhăn giữ phom dáng chuẩn công sở', description_en: 'Crisp spread collar, anti-wrinkle bamboo fabric for sharp office looks', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-beige.png', category_id: 1, gender: Gender.male },
    { id: 4, name: 'Slim-Fit Stretch Casual Shirt', name_vi: 'Áo Sơ Mi Co Giãn Slim-Fit', name_en: 'Slim-Fit Stretch Casual Shirt', description: 'Modern tailored fit with 5% elastane for maximum freedom of movement', description_vi: 'Form ôm hiện đại pha thun co giãn 4 chiều, thoải mái vận động cả ngày', description_en: 'Modern tailored fit with 5% elastane for maximum freedom of movement', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-black.png', category_id: 1, gender: Gender.male },
    { id: 5, name: 'Slim Tapered Chino Pants', name_vi: 'Quần Chino Dáng Slim Tapered', name_en: 'Slim Tapered Chino Pants', description: 'Durable twill weave with a modern narrow hem, ideal for smart-casual pairing', description_vi: 'Vải kaki dệt chéo bền bỉ, ống ôm nhẹ trẻ trung dễ phối áo sơ mi hoặc polo', description_en: 'Durable twill weave with a modern narrow hem, ideal for smart-casual pairing', price: 320000, import_price: 220000, image_url: '/public/images/quan-chino-nam-beige.png', category_id: 2, gender: Gender.male },
    { id: 6, name: 'Relaxed Fit Utility Chino', name_vi: 'Quần Chino Khaki Ống Rộng', name_en: 'Relaxed Fit Utility Chino', description: 'Roomy fit around hips and thighs with deep functional pockets', description_vi: 'Thiết kế dáng suông thoải mái phần hông và đùi, túi sâu tiện lợi', description_en: 'Roomy fit around hips and thighs with deep functional pockets', price: 320000, import_price: 220000, image_url: '/public/images/quan-chino-nam-blue.png', category_id: 2, gender: Gender.male },
    { id: 7, name: 'Vintage Straight Denim Jeans', name_vi: 'Quần Jean Nam Dáng Thẳng Vintage', name_en: 'Vintage Straight Denim Jeans', description: '13oz heavyweight indigo denim with classic contrast stitching', description_vi: 'Chất liệu jean 13oz bền bỉ, đường chỉ may nổi phong cách cổ điển', description_en: '13oz heavyweight indigo denim with classic contrast stitching', price: 320000, import_price: 220000, image_url: '/public/images/quan-jean-nam-dark-gray.png', category_id: 2, gender: Gender.male },
    { id: 8, name: 'Modern Slim Flex Denim Jeans', name_vi: 'Quần Jean Nam Slim Flex Co Giãn', name_en: 'Modern Slim Flex Denim Jeans', description: 'Soft washed stretch denim providing maximum flexibility for urban wear', description_vi: 'Chất jean xử lý wash mềm mại, co giãn tốt cho các hoạt động phố thị', description_en: 'Soft washed stretch denim providing maximum flexibility for urban wear', price: 320000, import_price: 220000, image_url: '/public/images/quan-jean-nam-light-blue.png', category_id: 2, gender: Gender.male },
    { id: 9, name: 'Heavyweight Fleece Hoodie', name_vi: 'Áo Hoodie Nỉ Bông Dày Dặn', name_en: 'Heavyweight Fleece Hoodie', description: '400gsm brushed fleece interior with double-layered drawstring hood', description_vi: 'Chất nỉ bông 400gsm giữ nhiệt vượt trội, nón 2 lớp may chèn cao cấp', description_en: '400gsm brushed fleece interior with double-layered drawstring hood', price: 150000, import_price: 100000, image_url: '/public/images/ao-hoodie-nam-red.png', category_id: 3, gender: Gender.male },
    { id: 10, name: 'Urban Streetwear Graphic Hoodie', name_vi: 'Áo Hoodie Streetwear Đô Thị', name_en: 'Urban Streetwear Graphic Hoodie', description: 'Kangaroo pocket with rib-knit cuffs, relaxed drop-shoulder silhouette', description_vi: 'Dáng vai trễ khoẻ khoắn, túi kangaroo tiện dụng cùng bo lai co giãn tốt', description_en: 'Kangaroo pocket with rib-knit cuffs, relaxed drop-shoulder silhouette', price: 150000, import_price: 100000, image_url: '/public/images/ao-hoodie-nam-green.png', category_id: 3, gender: Gender.male },
    { id: 11, name: 'Water-Resistant Hooded Windbreaker', name_vi: 'Áo Khoác Gió Kháng Nước Có Mũ', name_en: 'Water-Resistant Hooded Windbreaker', description: 'Lightweight nylon shell with mesh lining and adjustable drawstrings', description_vi: 'Lớp vỏ nylon chống thấm nhẹ, lót lưới thoáng khí cùng dây rút tuỳ chỉnh', description_en: 'Lightweight nylon shell with mesh lining and adjustable drawstrings', price: 150000, import_price: 100000, image_url: '/public/images/ao-khoac-nam-blue.png', category_id: 3, gender: Gender.male },
    { id: 12, name: 'Packable Sports Running Windbreaker', name_vi: 'Áo Gió Thể Thao Gọn Nhẹ', name_en: 'Packable Sports Running Windbreaker', description: 'Ultra-compressible design, reflective zipper elements for night runs', description_vi: 'Thiết kế gấp gọn dễ dàng, trang bị khoá kéo phản quang an toàn khi chạy đêm', description_en: 'Ultra-compressible design, reflective zipper elements for night runs', price: 150000, import_price: 100000, image_url: '/public/images/ao-khoac-nam-yellow.png', category_id: 3, gender: Gender.male },
    { id: 13, name: 'Soft Silk-Touch Women Shirt', name_vi: 'Áo Sơ Mi Nữ Lụa Mềm Mại', name_en: 'Soft Silk-Touch Women Shirt', description: 'Silky smooth drape with elegant v-neckline for office sophistication', description_vi: 'Chất lụa rủ mềm mại, cổ V quyến rũ mang lại vẻ thanh lịch nữ tính', description_en: 'Silky smooth drape with elegant v-neckline for office sophistication', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-white.png', category_id: 4, gender: Gender.female },
    { id: 14, name: 'Cropped Linen Blouse', name_vi: 'Áo Sơ Mi Nữ Dáng Cropped Linen', name_en: 'Cropped Linen Blouse', description: 'Modern cropped waistline, breathable organic linen fabric', description_vi: 'Chiều dài cropped hiện đại, chất liệu linen hữu cơ thoáng mát ngày hè', description_en: 'Modern cropped waistline, breathable organic linen fabric', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-green.png', category_id: 4, gender: Gender.female },
    { id: 15, name: 'Vertical Striped Boyfriend Shirt', name_vi: 'Áo Sơ Mi Nữ Kẻ Sọc Boyfriend', name_en: 'Vertical Striped Boyfriend Shirt', description: 'Oversized relaxed silhouette with fine pinstripes', description_vi: 'Form rộng boyfriend thoải mái cùng hoạ tiết kẻ sọc mảnh tôn dáng', description_en: 'Oversized relaxed silhouette with fine pinstripes', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-ke-soc-white.png', category_id: 4, gender: Gender.female },
    { id: 16, name: 'Mandarin Collar Casual Blouse', name_vi: 'Áo Sơ Mi Nữ Cổ Tàu Nhã Nhặn', name_en: 'Mandarin Collar Casual Blouse', description: 'Minimalist mandarin collar with concealed button placket', description_vi: 'Thiết kế cổ tàu tối giản, nẹp giấu nút tinh tế phù hợp nhiều hoàn cảnh', description_en: 'Minimalist mandarin collar with concealed button placket', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-ke-soc-blue.png', category_id: 4, gender: Gender.female },
    { id: 17, name: 'Ribbed Contour Crop Tee', name_vi: 'Áo Thun Nữ Ôm Sát Cổ Tròn', name_en: 'Ribbed Contour Crop Tee', description: 'Stretchy ribbed knit fabric that contours comfortably to your figure', description_vi: 'Chất thun gân co giãn ôm dáng nhẹ nhàng, tôn vẻ đẹp tự nhiên', description_en: 'Stretchy ribbed knit fabric that contours comfortably to your figure', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-co-tron-nu-blue.png', category_id: 5, gender: Gender.female },
    { id: 18, name: 'Vintage Wash Oversized Female Tee', name_vi: 'Áo Thun Nữ Form Rộng Wash Vintage', name_en: 'Vintage Wash Oversized Female Tee', description: 'Soft vintage washed cotton with drop shoulder pattern', description_vi: 'Chất cotton xử lý wash màu giả cổ, vai trễ cá tính và năng động', description_en: 'Soft vintage washed cotton with drop shoulder pattern', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-co-tron-nu-navy.png', category_id: 5, gender: Gender.female },
    { id: 19, name: 'Organic Crewneck Basic Tee', name_vi: 'Áo Thun Nữ Cotton Hữu Cơ Cơ Bản', name_en: 'Organic Crewneck Basic Tee', description: '100% combed organic cotton, ultra-soft and gentle on sensitive skin', description_vi: '100% cotton hữu cơ chải kỹ, siêu mềm mịn không gây kích ứng da', description_en: '100% combed organic cotton, ultra-soft and gentle on sensitive skin', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-vai-cotton-nu-white.png', category_id: 5, gender: Gender.female },
    { id: 20, name: 'V-Neck Feminine Slim Tee', name_vi: 'Áo Thun Nữ Cổ V Thanh Lịch', name_en: 'V-Neck Feminine Slim Tee', description: 'Flattering V-neck cut crafted from breathable modal-cotton blend', description_vi: 'Đường cắt cổ V tinh tế từ chất liệu pha modal cao cấp siêu mát', description_en: 'Flattering V-neck cut crafted from breathable modal-cotton blend', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-vai-cotton-nu-black.png', category_id: 5, gender: Gender.female },
    { id: 21, name: 'High-Waisted Tailored Gear Trouser', name_vi: 'Quần Tây Nữ Cạp Cao Ống Rộng', name_en: 'High-Waisted Tailored Gear Trouser', description: 'Structured pleats with high-rise waist for an elongated leg look', description_vi: 'Xếp ly chỉn chu cùng cạp cao giúp hack dáng chiều cao hiệu quả', description_en: 'Structured pleats with high-rise waist for an elongated leg look', price: 450000, import_price: 310000, image_url: '/public/images/quan-dai-gear-nu-beige.png', category_id: 6, gender: Gender.female },
    { id: 22, name: 'Ankle-Length Stretch Smart Pants', name_vi: 'Quần Dài Nữ Ôm Cổ Chân Co Giãn', name_en: 'Ankle-Length Stretch Smart Pants', description: 'Cropped hem above ankles, perfect for heels or casual sneakers', description_vi: 'Chiều dài chạm cổ chân hiện đại, dễ kết hợp với giày cao gót hoặc sneaker', description_en: 'Cropped hem above ankles, perfect for heels or casual sneakers', price: 450000, import_price: 310000, image_url: '/public/images/quan-dai-gear-nu-green.png', category_id: 6, gender: Gender.female },
    { id: 23, name: 'Cozy Wide-Leg Knit Lounge Pants', name_vi: 'Quần Dệt Kim Nữ Ống Suông Thoải Mái', name_en: 'Cozy Wide-Leg Knit Lounge Pants', description: 'Soft breathable ribbed knit with elasticized drawstring waistband', description_vi: 'Chất dệt kim mềm mại, cạp thun dây rút thoải mái khi đi chơi hay ở nhà', description_en: 'Soft breathable ribbed knit with elasticized drawstring waistband', price: 450000, import_price: 310000, image_url: '/public/images/quan-det-kim-nu-gray.png', category_id: 6, gender: Gender.female },
    { id: 24, name: 'Straight-Cut Minimalist Suit Pants', name_vi: 'Quần Tây Nữ Dáng Đứng Tối Giản', name_en: 'Straight-Cut Minimalist Suit Pants', description: 'Wrinkle-resistant fabric with clean crease line down the center', description_vi: 'Vải đứng phom chống nhăn, nếp ly giữa tinh tế tạo nét chỉn chu công sở', description_en: 'Wrinkle-resistant fabric with clean crease line down the center', price: 450000, import_price: 310000, image_url: '/public/images/quan-det-kim-nu-khaki.png', category_id: 6, gender: Gender.female },
    { id: 25, name: 'Heavyweight Streetwear Unisex Tee', name_vi: 'Áo Thun Unisex Phố Thị Dày Dặn', name_en: 'Heavyweight Streetwear Unisex Tee', description: '280gsm combed cotton jersey, structured drop-shoulder fit', description_vi: 'Cotton 280gsm dày dặn đứng phom, dáng xuông vai trễ cá tính chuẩn streetwear', description_en: '280gsm combed cotton jersey, structured drop-shoulder fit', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-ngan-unisex-gray.png', category_id: 7, gender: Gender.unisex },
    { id: 26, name: 'Breathable Athletic Performance Tee', name_vi: 'Áo Thun Unisex Thể Thao Thoáng Khí', name_en: 'Breathable Athletic Performance Tee', description: 'Quick-dry honeycomb mesh fabric for workouts and daily activities', description_vi: 'Vải dệt lưới tổ ong thấm hút và khô nhanh, lý tưởng cho tập luyện và vận động', description_en: 'Quick-dry honeycomb mesh fabric for workouts and daily activities', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png', category_id: 7, gender: Gender.unisex },
    { id: 27, name: 'Long-Sleeve Ribbed Collar Unisex Tee', name_vi: 'Áo Thun Tay Dài Unisex Bo Cổ', name_en: 'Long-Sleeve Ribbed Collar Unisex Tee', description: 'Classic long sleeve layout with durable rib-knit cuffs and neckband', description_vi: 'Áo tay dài cổ bo gân bền đẹp, chất vải mềm mại cho những ngày se lạnh', description_en: 'Classic long sleeve layout with durable rib-knit cuffs and neckband', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-dai-unisex-blue.png', category_id: 7, gender: Gender.unisex },
    { id: 28, name: 'Graphic Art Boxy Fit Unisex Tee', name_vi: 'Áo Thun Unisex Boxy Fit Độc Đáo', name_en: 'Graphic Art Boxy Fit Unisex Tee', description: 'Boxy streetwear silhouette with clean finished hems', description_vi: 'Form boxy vuông vức cá tính, đường may cẩn thận từng chi tiết', description_en: 'Boxy streetwear silhouette with clean finished hems', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-dai-unisex-green.png', category_id: 7, gender: Gender.unisex },
    { id: 29, name: 'Drawstring Cargo Pocket Track Pants', name_vi: 'Quần Dài Unisex Túi Hộp Năng Động', name_en: 'Drawstring Cargo Pocket Track Pants', description: 'Functional side cargo pockets with toggle drawstring cuffs', description_vi: 'Túi hộp 2 bên tiện lợi, bo gấu rút dây biến tấu phong cách dễ dàng', description_en: 'Functional side cargo pockets with toggle drawstring cuffs', price: 250000, import_price: 170000, image_url: '/public/images/quan-dai-unisex-beige.png', category_id: 8, gender: Gender.unisex },
    { id: 30, name: 'Relaxed Canvas Workwear Trousers', name_vi: 'Quần Dài Unisex Vải Canvas Bền Bỉ', name_en: 'Relaxed Canvas Workwear Trousers', description: 'Heavy duty cotton canvas build for ultimate durability', description_vi: 'Chất liệu canvas cotton siêu bền, phù hợp mọi hoạt động di chuyển', description_en: 'Heavy duty cotton canvas build for ultimate durability', price: 250000, import_price: 170000, image_url: '/public/images/quan-dai-unisex-green.png', category_id: 8, gender: Gender.unisex },
    { id: 31, name: 'Loose-Fit Washed Unisex Jeans', name_vi: 'Quần Jean Unisex Form Rộng Wash Sáng', name_en: 'Loose-Fit Washed Unisex Jeans', description: 'Relaxed leg silhouette with distressed vintage fade processing', description_vi: 'Form rộng thoải mái với mảng wash màu khói tự nhiên cực chất', description_en: 'Relaxed leg silhouette with distressed vintage fade processing', price: 250000, import_price: 170000, image_url: '/public/images/quan-jean-unisex-blue.png', category_id: 8, gender: Gender.unisex },
    { id: 32, name: 'Straight Leg Black Denim Unisex Jeans', name_vi: 'Quần Jean Unisex Đen Dáng Đứng', name_en: 'Straight Leg Black Denim Unisex Jeans', description: 'Deep black dyed denim that keeps its rich tone wash after wash', description_vi: 'Tone màu đen tuyền giữ màu lâu, dễ dàng mix-match với mọi loại trang phục', description_en: 'Deep black dyed denim that keeps its rich tone wash after wash', price: 250000, import_price: 170000, image_url: '/public/images/quan-jean-unisex-black.png', category_id: 8, gender: Gender.unisex },
    { id: 33, name: 'French Terry Elastic Sweat Shorts', name_vi: 'Quần Short Unisex Nỉ Da Cá Nhẹ Nhàng', name_en: 'French Terry Elastic Sweat Shorts', description: 'Breathable loopback French terry with deep side slash pockets', description_vi: 'Chất nỉ da cá thoáng mát, túi xéo sâu chứa đồ thoải mái', description_en: 'Breathable loopback French terry with deep side slash pockets', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-gray.png', category_id: 9, gender: Gender.unisex },
    { id: 34, name: 'Quick-Dry Nylon Summer Shorts', name_vi: 'Quần Short Unisex Nylon Khô Nhanh', name_en: 'Quick-Dry Nylon Summer Shorts', description: 'Water-repellent lightweight nylon, built for beach and summer casual', description_vi: 'Chất nylon trượt nước nhẹ, khô nhanh thích hợp dạo phố hay đi biển', description_en: 'Water-repellent lightweight nylon, built for beach and summer casual', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-white.png', category_id: 9, gender: Gender.unisex },
    { id: 35, name: 'Utility Multi-Pocket Trail Shorts', name_vi: 'Quần Short Unisex Túi Hộp Đa Năng', name_en: 'Utility Multi-Pocket Trail Shorts', description: 'Built-in adjustable webbing belt and durable ripstop fabric', description_vi: 'Đi kèm đai lưng dệt tiện lợi cùng chất liệu ripstop chống xé', description_en: 'Built-in adjustable webbing belt and durable ripstop fabric', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-green.png', category_id: 9, gender: Gender.unisex },
    { id: 36, name: 'Classic Cotton Twill Shorts', name_vi: 'Quần Short Unisex Cotton Twill Cổ Điển', name_en: 'Classic Cotton Twill Shorts', description: 'Tailored 7-inch inseam shorts with clean button closure', description_vi: 'Chiều dài 7 inch vừa phải, chất vải twill mềm mịn thoải mái', description_en: 'Tailored 7-inch inseam shorts with clean button closure', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-navy.png', category_id: 9, gender: Gender.unisex },
  ];

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log('✔ Products');

  // ============================================================
  // 5. PRODUCT COLORS  
  // ============================================================
  const productColorsData = [
    { product_id: 1, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nam-white.png' },
    { product_id: 1, color_name: 'Sky Blue', color_name_vi: 'Xanh Da Trời', color_name_en: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nam-blue.png' },
    { product_id: 2, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nam-white.png' },
    { product_id: 2, color_name: 'Sky Blue', color_name_vi: 'Xanh Da Trời', color_name_en: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nam-blue.png' },
    { product_id: 3, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#C3B091', image_url: '/public/images/ao-so-mi-nam-beige.png' },
    { product_id: 3, color_name: 'Black', color_name_vi: 'Đen', color_name_en: 'Black', color_code: '#000000', image_url: '/public/images/ao-so-mi-nam-black.png' },
    { product_id: 4, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#C3B091', image_url: '/public/images/ao-so-mi-nam-beige.png' },
    { product_id: 4, color_name: 'Black', color_name_vi: 'Đen', color_name_en: 'Black', color_code: '#000000', image_url: '/public/images/ao-so-mi-nam-black.png' },
    { product_id: 5, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-chino-nam-beige.png' },
    { product_id: 5, color_name: 'Blue', color_name_vi: 'Xanh Dương', color_name_en: 'Blue', color_code: '#0000FF', image_url: '/public/images/quan-chino-nam-blue.png' },
    { product_id: 6, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-chino-nam-beige.png' },
    { product_id: 6, color_name: 'Blue', color_name_vi: 'Xanh Dương', color_name_en: 'Blue', color_code: '#0000FF', image_url: '/public/images/quan-chino-nam-blue.png' },
    { product_id: 7, color_name: 'Light Blue', color_name_vi: 'Xanh Nhạt', color_name_en: 'Light Blue', color_code: '#e5ecf6', image_url: '/public/images/quan-jean-nam-light-blue.png' },
    { product_id: 7, color_name: 'Dark Gray', color_name_vi: 'Xám Đậm', color_name_en: 'Dark Gray', color_code: '#232227', image_url: '/public/images/quan-jean-nam-dark-gray.png' },
    { product_id: 8, color_name: 'Light Blue', color_name_vi: 'Xanh Nhạt', color_name_en: 'Light Blue', color_code: '#e5ecf6', image_url: '/public/images/quan-jean-nam-light-blue.png' },
    { product_id: 8, color_name: 'Dark Gray', color_name_vi: 'Xám Đậm', color_name_en: 'Dark Gray', color_code: '#232227', image_url: '/public/images/quan-jean-nam-dark-gray.png' },
    { product_id: 9, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#6f7c6b', image_url: '/public/images/ao-hoodie-nam-green.png' },
    { product_id: 9, color_name: 'Red', color_name_vi: 'Đỏ', color_name_en: 'Red', color_code: '#d74d55', image_url: '/public/images/ao-hoodie-nam-red.png' },
    { product_id: 10, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#6f7c6b', image_url: '/public/images/ao-hoodie-nam-green.png' },
    { product_id: 10, color_name: 'Red', color_name_vi: 'Đỏ', color_name_en: 'Red', color_code: '#d74d55', image_url: '/public/images/ao-hoodie-nam-red.png' },
    { product_id: 11, color_name: 'Blue', color_name_vi: 'Xanh Dương', color_name_en: 'Blue', color_code: '#007bff', image_url: '/public/images/ao-khoac-nam-blue.png' },
    { product_id: 11, color_name: 'Yellow', color_name_vi: 'Vàng', color_name_en: 'Yellow', color_code: '#d4a017', image_url: '/public/images/ao-khoac-nam-yellow.png' },
    { product_id: 12, color_name: 'Blue', color_name_vi: 'Xanh Dương', color_name_en: 'Blue', color_code: '#007bff', image_url: '/public/images/ao-khoac-nam-blue.png' },
    { product_id: 12, color_name: 'Yellow', color_name_vi: 'Vàng', color_name_en: 'Yellow', color_code: '#d4a017', image_url: '/public/images/ao-khoac-nam-yellow.png' },
    { product_id: 13, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-white.png' },
    { product_id: 13, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#A9E5BB', image_url: '/public/images/ao-so-mi-nu-green.png' },
    { product_id: 14, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-white.png' },
    { product_id: 14, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#A9E5BB', image_url: '/public/images/ao-so-mi-nu-green.png' },
    { product_id: 15, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-ke-soc-white.png' },
    { product_id: 15, color_name: 'Sky Blue', color_name_vi: 'Xanh Da Trời', color_name_en: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nu-ke-soc-blue.png' },
    { product_id: 16, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-ke-soc-white.png' },
    { product_id: 16, color_name: 'Sky Blue', color_name_vi: 'Xanh Da Trời', color_name_en: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nu-ke-soc-blue.png' },
    { product_id: 17, color_name: 'Sky Blue', color_name_vi: 'Xanh Da Trời', color_name_en: 'Sky Blue', color_code: '#dce2f0', image_url: '/public/images/ao-thun-co-tron-nu-blue.png' },
    { product_id: 17, color_name: 'Navy', color_name_vi: 'Xanh Navy', color_name_en: 'Navy', color_code: '#2b3b5d', image_url: '/public/images/ao-thun-co-tron-nu-navy.png' },
    { product_id: 18, color_name: 'Sky Blue', color_name_vi: 'Xanh Da Trời', color_name_en: 'Sky Blue', color_code: '#dce2f0', image_url: '/public/images/ao-thun-co-tron-nu-blue.png' },
    { product_id: 18, color_name: 'Navy', color_name_vi: 'Xanh Navy', color_name_en: 'Navy', color_code: '#2b3b5d', image_url: '/public/images/ao-thun-co-tron-nu-navy.png' },
    { product_id: 19, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-thun-vai-cotton-nu-white.png' },
    { product_id: 19, color_name: 'Black', color_name_vi: 'Đen', color_name_en: 'Black', color_code: '#000000', image_url: '/public/images/ao-thun-vai-cotton-nu-black.png' },
    { product_id: 20, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-thun-vai-cotton-nu-white.png' },
    { product_id: 20, color_name: 'Black', color_name_vi: 'Đen', color_name_en: 'Black', color_code: '#000000', image_url: '/public/images/ao-thun-vai-cotton-nu-black.png' },
    { product_id: 21, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-dai-gear-nu-beige.png' },
    { product_id: 21, color_name: 'Dark Green', color_name_vi: 'Xanh Đậm', color_name_en: 'Dark Green', color_code: '#0A3D3B', image_url: '/public/images/quan-dai-gear-nu-green.png' },
    { product_id: 22, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-dai-gear-nu-beige.png' },
    { product_id: 22, color_name: 'Dark Green', color_name_vi: 'Xanh Đậm', color_name_en: 'Dark Green', color_code: '#0A3D3B', image_url: '/public/images/quan-dai-gear-nu-green.png' },
    { product_id: 23, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#b6a498', image_url: '/public/images/quan-det-kim-nu-khaki.png' },
    { product_id: 23, color_name: 'Gray', color_name_vi: 'Xám', color_name_en: 'Gray', color_code: '#515055', image_url: '/public/images/quan-det-kim-nu-gray.png' },
    { product_id: 24, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#b6a498', image_url: '/public/images/quan-det-kim-nu-khaki.png' },
    { product_id: 24, color_name: 'Gray', color_name_vi: 'Xám', color_name_en: 'Gray', color_code: '#515055', image_url: '/public/images/quan-det-kim-nu-gray.png' },
    { product_id: 25, color_name: 'Gray', color_name_vi: 'Xám', color_name_en: 'Gray', color_code: '#c0c8d3', image_url: '/public/images/ao-thun-tay-ngan-unisex-gray.png' },
    { product_id: 25, color_name: 'Dark Gray', color_name_vi: 'Xám Đậm', color_name_en: 'Dark Gray', color_code: '#474b4e', image_url: '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png' },
    { product_id: 26, color_name: 'Gray', color_name_vi: 'Xám', color_name_en: 'Gray', color_code: '#c0c8d3', image_url: '/public/images/ao-thun-tay-ngan-unisex-gray.png' },
    { product_id: 26, color_name: 'Dark Gray', color_name_vi: 'Xám Đậm', color_name_en: 'Dark Gray', color_code: '#474b4e', image_url: '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png' },
    { product_id: 27, color_name: 'Dark Blue', color_name_vi: 'Xanh Đậm', color_name_en: 'Dark Blue', color_code: '#2c3546', image_url: '/public/images/ao-thun-tay-dai-unisex-blue.png' },
    { product_id: 27, color_name: 'Light Green', color_name_vi: 'Xanh Lá Nhạt', color_name_en: 'Light Green', color_code: '#b3b6af', image_url: '/public/images/ao-thun-tay-dai-unisex-green.png' },
    { product_id: 28, color_name: 'Dark Blue', color_name_vi: 'Xanh Đậm', color_name_en: 'Dark Blue', color_code: '#2c3546', image_url: '/public/images/ao-thun-tay-dai-unisex-blue.png' },
    { product_id: 28, color_name: 'Light Green', color_name_vi: 'Xanh Lá Nhạt', color_name_en: 'Light Green', color_code: '#b3b6af', image_url: '/public/images/ao-thun-tay-dai-unisex-green.png' },
    { product_id: 29, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#5a6151', image_url: '/public/images/quan-dai-unisex-green.png' },
    { product_id: 29, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#cab99f', image_url: '/public/images/quan-dai-unisex-beige.png' },
    { product_id: 30, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#5a6151', image_url: '/public/images/quan-dai-unisex-green.png' },
    { product_id: 30, color_name: 'Beige', color_name_vi: 'Be', color_name_en: 'Beige', color_code: '#cab99f', image_url: '/public/images/quan-dai-unisex-beige.png' },
    { product_id: 31, color_name: 'Blue', color_name_vi: 'Xanh Dương', color_name_en: 'Blue', color_code: '#1B4F72', image_url: '/public/images/quan-jean-unisex-blue.png' },
    { product_id: 31, color_name: 'Black', color_name_vi: 'Đen', color_name_en: 'Black', color_code: '#333333', image_url: '/public/images/quan-jean-unisex-black.png' },
    { product_id: 32, color_name: 'Blue', color_name_vi: 'Xanh Dương', color_name_en: 'Blue', color_code: '#1B4F72', image_url: '/public/images/quan-jean-unisex-blue.png' },
    { product_id: 32, color_name: 'Black', color_name_vi: 'Đen', color_name_en: 'Black', color_code: '#333333', image_url: '/public/images/quan-jean-unisex-black.png' },
    { product_id: 33, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#f1f0ee', image_url: '/public/images/quan-short-unisex-white.png' },
    { product_id: 33, color_name: 'Gray', color_name_vi: 'Xám', color_name_en: 'Gray', color_code: '#646b7d', image_url: '/public/images/quan-short-unisex-gray.png' },
    { product_id: 34, color_name: 'White', color_name_vi: 'Trắng', color_name_en: 'White', color_code: '#f1f0ee', image_url: '/public/images/quan-short-unisex-white.png' },
    { product_id: 34, color_name: 'Gray', color_name_vi: 'Xám', color_name_en: 'Gray', color_code: '#646b7d', image_url: '/public/images/quan-short-unisex-gray.png' },
    { product_id: 35, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#696C52', image_url: '/public/images/quan-short-unisex-green.png' },
    { product_id: 35, color_name: 'Navy', color_name_vi: 'Xanh Navy', color_name_en: 'Navy', color_code: '#2C3243', image_url: '/public/images/quan-short-unisex-navy.png' },
    { product_id: 36, color_name: 'Green', color_name_vi: 'Xanh Lá', color_name_en: 'Green', color_code: '#696C52', image_url: '/public/images/quan-short-unisex-green.png' },
    { product_id: 36, color_name: 'Navy', color_name_vi: 'Xanh Navy', color_name_en: 'Navy', color_code: '#2C3243', image_url: '/public/images/quan-short-unisex-navy.png' },
  ];

  const colorIdMap: number[] = [];
  for (const c of productColorsData) {
    const created = await prisma.productColor.create({ data: c });
    colorIdMap.push(created.id);
  }
  console.log('✔ Product colors');

  // ============================================================
  // 6. PRODUCT SIZES
  // ============================================================
  const productSizesRaw: [number, SizeEnum, number][] = [
    [1, 'S', 10], [1, 'M', 20], [1, 'L', 15],
    [2, 'S', 8], [2, 'M', 18], [2, 'L', 12],
    [3, 'S', 10], [3, 'M', 15], [3, 'L', 12],
    [4, 'S', 5], [4, 'M', 8], [4, 'L', 10],
    [5, 'S', 10], [5, 'M', 8], [5, 'L', 5],
    [6, 'S', 12], [6, 'M', 10], [6, 'L', 6],
    [7, 'S', 7], [7, 'M', 14], [7, 'L', 9],
    [8, 'S', 6], [8, 'M', 12], [8, 'L', 8],
    [9, 'S', 15], [9, 'M', 20], [9, 'L', 10],
    [10, 'S', 12], [10, 'M', 18], [10, 'L', 10],
    [11, 'S', 10], [11, 'M', 15], [11, 'L', 12],
    [12, 'S', 8], [12, 'M', 12], [12, 'L', 10],
    [13, 'S', 10], [13, 'M', 20], [13, 'L', 15],
    [14, 'S', 8], [14, 'M', 18], [14, 'L', 12],
    [15, 'S', 8], [15, 'M', 15], [15, 'L', 12],
    [16, 'S', 6], [16, 'M', 12], [16, 'L', 10],
    [17, 'S', 10], [17, 'M', 15], [17, 'L', 10],
    [18, 'S', 8], [18, 'M', 14], [18, 'L', 12],
    [19, 'S', 7], [19, 'M', 14], [19, 'L', 10],
    [20, 'S', 5], [20, 'M', 10], [20, 'L', 8],
    [21, 'S', 10], [21, 'M', 15], [21, 'L', 12],
    [22, 'S', 8], [22, 'M', 12], [22, 'L', 10],
    [23, 'S', 12], [23, 'M', 10], [23, 'L', 8],
    [24, 'S', 10], [24, 'M', 14], [24, 'L', 10],
    [25, 'S', 10], [25, 'M', 20], [25, 'L', 15],
    [26, 'S', 8], [26, 'M', 18], [26, 'L', 12],
    [27, 'S', 10], [27, 'M', 15], [27, 'L', 12],
    [28, 'S', 5], [28, 'M', 8], [28, 'L', 10],
    [29, 'S', 10], [29, 'M', 8], [29, 'L', 5],
    [30, 'S', 12], [30, 'M', 10], [30, 'L', 6],
    [31, 'S', 7], [31, 'M', 14], [31, 'L', 9],
    [32, 'S', 6], [32, 'M', 12], [32, 'L', 8],
    [33, 'S', 15], [33, 'M', 20], [33, 'L', 10],
    [34, 'S', 12], [34, 'M', 18], [34, 'L', 10],
    [35, 'S', 10], [35, 'M', 15], [35, 'L', 12],
    [36, 'S', 8], [36, 'M', 12], [36, 'L', 10],
    [37, 'S', 10], [37, 'M', 20], [37, 'L', 15],
    [38, 'S', 8], [38, 'M', 18], [38, 'L', 12],
    [39, 'S', 10], [39, 'M', 15], [39, 'L', 12],
    [40, 'S', 5], [40, 'M', 8], [40, 'L', 10],
    [41, 'S', 10], [41, 'M', 8], [41, 'L', 5],
    [42, 'S', 12], [42, 'M', 10], [42, 'L', 6],
    [43, 'S', 7], [43, 'M', 14], [43, 'L', 9],
    [44, 'S', 6], [44, 'M', 12], [44, 'L', 8],
    [45, 'S', 15], [45, 'M', 20], [45, 'L', 10],
    [46, 'S', 12], [46, 'M', 18], [46, 'L', 10],
    [47, 'S', 10], [47, 'M', 15], [47, 'L', 12],
    [48, 'S', 8], [48, 'M', 12], [48, 'L', 10],
    [49, 'S', 10], [49, 'M', 20], [49, 'L', 15],
    [50, 'S', 8], [50, 'M', 18], [50, 'L', 12],
    [51, 'S', 8], [51, 'M', 15], [51, 'L', 12],
    [52, 'S', 6], [52, 'M', 12], [52, 'L', 10],
    [53, 'S', 10], [53, 'M', 15], [53, 'L', 10],
    [54, 'S', 8], [54, 'M', 14], [54, 'L', 12],
    [55, 'S', 7], [55, 'M', 14], [55, 'L', 10],
    [56, 'S', 5], [56, 'M', 10], [56, 'L', 8],
    [57, 'S', 10], [57, 'M', 15], [57, 'L', 12],
    [58, 'S', 8], [58, 'M', 12], [58, 'L', 10],
    [59, 'S', 12], [59, 'M', 10], [59, 'L', 8],
    [60, 'S', 10], [60, 'M', 14], [60, 'L', 10],
    [61, 'S', 10], [61, 'M', 20], [61, 'L', 15],
    [62, 'S', 8], [62, 'M', 18], [62, 'L', 12],
    [63, 'S', 10], [63, 'M', 15], [63, 'L', 12],
    [64, 'S', 5], [64, 'M', 8], [64, 'L', 10],
    [65, 'S', 10], [65, 'M', 8], [65, 'L', 5],
    [66, 'S', 12], [66, 'M', 10], [66, 'L', 6],
    [67, 'S', 7], [67, 'M', 14], [67, 'L', 9],
    [68, 'S', 6], [68, 'M', 12], [68, 'L', 8],
    [69, 'S', 15], [69, 'M', 20], [69, 'L', 10],
    [70, 'S', 12], [70, 'M', 18], [70, 'L', 10],
    [71, 'S', 10], [71, 'M', 15], [71, 'L', 12],
    [72, 'S', 8], [72, 'M', 12], [72, 'L', 10],
  ];

  await prisma.productSize.createMany({
    data: productSizesRaw.map(([origColorId, size, stock]) => ({
      color_id: colorIdMap[origColorId - 1],
      size,
      stock,
    })),
  });
  console.log('✔ Product sizes');

  // ============================================================
  // 7. BANNERS
  // ============================================================
  await prisma.banner.createMany({
    data: [
      {
        image_url: '/public/images/banner1.png',
        title: 'WELCOME TO LOOM',
        title_vi: 'Chào Mừng Đến Với LOOM',
        title_en: 'Welcome to LOOM',
        subtitle: 'Nhập mã LOOM10 giảm ngay 10% cho đơn hàng đầu tiên từ 300k!',
        subtitle_vi: 'Nhập mã LOOM10 giảm ngay 10% cho đơn hàng đầu tiên từ 300k!',
        subtitle_en: 'Use code LOOM10 for 10% off your first order from 300k!',
      },
      {
        image_url: '/public/images/banner2.png',
        title: 'LOOM SUMMER GRAND SALE',
        title_vi: 'Đại Tiệc Ưu Đãi Mùa Hè - LOOM',
        title_en: 'LOOM Summer Grand Sale',
        subtitle: 'Giảm giá lên đến 20% cho toàn bộ các sản phẩm Áo & Quần!',
        subtitle_vi: 'Giảm giá lên đến 20% cho toàn bộ các sản phẩm Áo & Quần!',
        subtitle_en: 'Up to 20% off on all Shirts, T-shirts, Pants & Shorts!',
      },
      {
        image_url: '/public/images/banner3.png',
        title: 'MUA 2 TẶNG 1 ĐẶC BIỆT',
        title_vi: 'Ưu Đãi Mua 2 Áo Thun Tặng 1 Quần Short',
        title_en: 'Buy 2 T-shirts Get 1 Short Free',
        subtitle: 'Thêm 2 Áo Thun bất kỳ vào giỏ hàng để nhận ngay 1 Quần Short cao cấp!',
        subtitle_vi: 'Thêm 2 Áo Thun bất kỳ vào giỏ hàng để nhận ngay 1 Quần Short cao cấp!',
        subtitle_en: 'Buy any 2 T-shirts and receive 1 Premium Short for free!',
      },
      {
        image_url: '/public/images/banner4.png',
        title: 'ĐẶC QUYỀN HỘI VIÊN LOOM VIP',
        title_vi: 'Đặc Quyền Nâng Hạng Hội Viên VIP',
        title_en: 'LOOM VIP Membership Rewards',
        subtitle: 'Tích điểm nâng hạng Bạc/Vàng/Kim Cương – Giảm thêm lên đến 20%!',
        subtitle_vi: 'Tích điểm nâng hạng Bạc/Vàng/Kim Cương – Giảm thêm lên đến 20% khi thanh toán!',
        subtitle_en: 'Upgrade to Silver/Gold/Diamond for up to 20% extra discount!',
      },
    ],
  });
  console.log('✔ Banners');

  // ============================================================
  // 8. SALES
  // ============================================================
  await prisma.sale.create({
    data: {
      name: 'LOOM Summer Sale 2025',
      name_vi: 'Đại Tiệc Sale Mùa Hè LOOM 2025',
      name_en: 'LOOM Summer Grand Sale 2025',
      discount_percent: 20,
      apply_scope: ApplyScope.all,
      start_date: daysAgo(15),
      end_date: daysFromNow(45),
      status: true,
    },
  });
  console.log('✔ Sales');

  // ============================================================
  // 9. VOUCHERS
  // ============================================================
  await prisma.voucher.create({
    data: {
      code: 'LOOM10',
      description_vi: 'Giảm 10% tối đa 50.000đ cho đơn hàng từ 300.000đ',
      description_en: '10% off up to 50k for orders from 300k',
      discount_percent: 10,
      max_discount_amount: 50000,
      min_order_value: 300000,
      usage_limit: 100,
      used_count: 15,
      start_date: daysAgo(30),
      end_date: daysFromNow(60),
      status: true,
      apply_scope: ApplyScope.all,
    },
  });
  console.log('✔ Vouchers');

  // ============================================================
  // 10. PROMOTIONS (BUY X GET Y)
  // ============================================================
  await prisma.buyXGetYPromotion.create({
    data: {
      name: 'Buy 2 T-Shirts Get 1 Short Free',
      name_vi: 'Mua 2 Áo Thun Unisex Tặng 1 Quần Short',
      name_en: 'Buy 2 Unisex T-shirts Get 1 Short Free',
      description_vi: 'Mua 2 Áo Thun Unisex Phố Thị (ID 25) nhận ngay 1 Quần Short Nỉ Da Cá (ID 33) miễn phí',
      description_en: 'Buy 2 Heavyweight Streetwear Unisex Tees (ID 25) get 1 French Terry Sweat Short (ID 33) free',
      buy_product_id: 25,
      buy_quantity: 2,
      gift_product_id: 33,
      gift_quantity: 1,
      start_date: daysAgo(15),
      end_date: daysFromNow(45),
      max_gift_per_order: 2,
      total_gift_limit: 50,
      priority: 1,
      is_stackable: true,
      status: PromotionStatus.active,
      is_active: true,
    },
  });
  console.log('✔ BuyXGetY Promotions');

  // ============================================================
  // 11. ORDERS & ORDER ITEMS
  // ============================================================
  const ordersData = [
    { id: 101, name: 'Ngày 01', email: 'ngay01@test.com', phone: '0900000001', address: 'Hà Nội', created_at: daysAgo(30), status: OrderStatus.Pending, payment_status: 'Unpaid' as any },
    { id: 102, name: 'Ngày 02', email: 'ngay02@test.com', phone: '0900000002', address: 'TP HCM', created_at: daysAgo(29), status: OrderStatus.Pending, payment_status: 'Unpaid' as any },
    { id: 103, name: 'Ngày 03', email: 'ngay03@test.com', phone: '0900000003', address: 'Đà Nẵng', created_at: daysAgo(28), status: OrderStatus.Pending, payment_status: 'Unpaid' as any },
    { id: 104, name: 'Ngày 04', email: 'ngay04@test.com', phone: '0900000004', address: 'Cần Thơ', created_at: daysAgo(27), status: OrderStatus.Pending, payment_status: 'Unpaid' as any },
    { id: 105, name: 'Ngày 05', email: 'ngay05@test.com', phone: '0900000005', address: 'Hải Phòng', created_at: daysAgo(26), status: OrderStatus.Confirmed, payment_status: 'Paid' as any },
    { id: 106, name: 'Ngày 06', email: 'ngay06@test.com', phone: '0900000006', address: 'Nha Trang', created_at: daysAgo(25), status: OrderStatus.Confirmed, payment_status: 'Paid' as any },
    { id: 107, name: 'Ngày 07', email: 'ngay07@test.com', phone: '0900000007', address: 'Huế', created_at: daysAgo(24), status: OrderStatus.Confirmed, payment_status: 'Paid' as any },
    { id: 108, name: 'Ngày 08', email: 'ngay08@test.com', phone: '0900000008', address: 'Hà Nội', created_at: daysAgo(23), status: OrderStatus.Confirmed, payment_status: 'Paid' as any },
    { id: 109, name: 'Ngày 09', email: 'ngay09@test.com', phone: '0900000009', address: 'TP HCM', created_at: daysAgo(22), status: OrderStatus.Shipping, payment_status: 'Paid' as any },
    { id: 110, name: 'Ngày 10', email: 'ngay10@test.com', phone: '0900000010', address: 'Đà Nẵng', created_at: daysAgo(21), status: OrderStatus.Shipping, payment_status: 'Paid' as any },
    { id: 111, name: 'Ngày 11', email: 'ngay11@test.com', phone: '0900000011', address: 'Cần Thơ', created_at: daysAgo(20), status: OrderStatus.Shipping, payment_status: 'Paid' as any },
    { id: 112, name: 'Ngày 12', email: 'ngay12@test.com', phone: '0900000012', address: 'Hải Phòng', created_at: daysAgo(19), status: OrderStatus.Shipping, payment_status: 'Paid' as any },
    { id: 113, name: 'Ngày 13', email: 'ngay13@test.com', phone: '0900000013', address: 'Nha Trang', created_at: daysAgo(18), status: OrderStatus.Cancelled, payment_status: 'Unpaid' as any },
    { id: 114, name: 'Ngày 14', email: 'ngay14@test.com', phone: '0900000014', address: 'Huế', created_at: daysAgo(17), status: OrderStatus.Cancelled, payment_status: 'Unpaid' as any },
    { id: 115, name: 'Ngày 15', email: 'ngay15@test.com', phone: '0900000015', address: 'Hà Nội', created_at: daysAgo(16), status: OrderStatus.Cancelled, payment_status: 'Unpaid' as any },
    { id: 116, name: 'Ngày 16', email: 'ngay16@test.com', phone: '0900000016', address: 'TP HCM', created_at: daysAgo(15), status: OrderStatus.Cancelled, payment_status: 'Unpaid' as any },
    { id: 117, name: 'Ngày 17', email: 'ngay17@test.com', phone: '0900000017', address: 'Đà Nẵng', created_at: daysAgo(14), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 118, name: 'Ngày 18', email: 'ngay18@test.com', phone: '0900000018', address: 'Cần Thơ', created_at: daysAgo(13), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 119, name: 'Ngày 19', email: 'ngay19@test.com', phone: '0900000019', address: 'Hải Phòng', created_at: daysAgo(12), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 120, name: 'Ngày 20', email: 'ngay20@test.com', phone: '0900000020', address: 'Nha Trang', created_at: daysAgo(11), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 121, name: 'Ngày 21', email: 'ngay21@test.com', phone: '0900000021', address: 'Huế', created_at: daysAgo(10), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 122, name: 'Ngày 22', email: 'ngay22@test.com', phone: '0900000022', address: 'Hà Nội', created_at: daysAgo(9), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 123, name: 'Ngày 23', email: 'ngay23@test.com', phone: '0900000023', address: 'TP HCM', created_at: daysAgo(8), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 124, name: 'Ngày 24', email: 'ngay24@test.com', phone: '0900000024', address: 'Đà Nẵng', created_at: daysAgo(7), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 125, name: 'Ngày 25', email: 'ngay25@test.com', phone: '0900000025', address: 'Cần Thơ', created_at: daysAgo(6), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 126, name: 'Ngày 26', email: 'ngay26@test.com', phone: '0900000026', address: 'Hải Phòng', created_at: daysAgo(5), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 127, name: 'Ngày 27', email: 'ngay27@test.com', phone: '0900000027', address: 'Nha Trang', created_at: daysAgo(4), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 128, name: 'Ngày 28', email: 'ngay28@test.com', phone: '0900000028', address: 'Huế', created_at: daysAgo(3), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 129, name: 'Ngày 29', email: 'ngay29@test.com', phone: '0900000029', address: 'Hà Nội', created_at: daysAgo(2), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 130, name: 'Ngày 30', email: 'ngay30@test.com', phone: '0900000030', address: 'TP HCM', created_at: daysAgo(1), status: OrderStatus.Delivered, payment_status: 'Paid' as any },
    { id: 201, name: 'Tháng 01', email: 'thang01@test.com', phone: '0900000031', address: 'Hà Nội', created_at: monthsAgoDay15(12), status: OrderStatus.Return_Requested, payment_status: 'Paid' as any },
    { id: 202, name: 'Tháng 02', email: 'thang02@test.com', phone: '0900000032', address: 'TP HCM', created_at: monthsAgoDay15(11), status: OrderStatus.Return_Approved, payment_status: 'Refunded' as any },
    { id: 203, name: 'Tháng 03', email: 'thang03@test.com', phone: '0900000033', address: 'Đà Nẵng', created_at: monthsAgoDay15(10), status: OrderStatus.Return_Rejected, payment_status: 'Paid' as any },
    { id: 204, name: 'Tháng 04', email: 'thang04@test.com', phone: '0900000034', address: 'Cần Thơ', created_at: monthsAgoDay15(9), status: OrderStatus.Return_Requested, payment_status: 'Paid' as any },
    { id: 205, name: 'Tháng 05', email: 'thang05@test.com', phone: '0900000035', address: 'Hải Phòng', created_at: monthsAgoDay15(8), status: OrderStatus.Return_Approved, payment_status: 'Refunded' as any },
    { id: 206, name: 'Tháng 06', email: 'thang06@test.com', phone: '0900000036', address: 'Nha Trang', created_at: monthsAgoDay15(7), status: OrderStatus.Return_Rejected, payment_status: 'Paid' as any },
    { id: 207, name: 'Tháng 07', email: 'thang07@test.com', phone: '0900000037', address: 'Huế', created_at: monthsAgoDay15(6), status: OrderStatus.Return_Requested, payment_status: 'Paid' as any },
    { id: 208, name: 'Tháng 08', email: 'thang08@test.com', phone: '0900000038', address: 'Hà Nội', created_at: monthsAgoDay15(5), status: OrderStatus.Return_Approved, payment_status: 'Refunded' as any },
    { id: 209, name: 'Tháng 09', email: 'thang09@test.com', phone: '0900000039', address: 'TP HCM', created_at: monthsAgoDay15(4), status: OrderStatus.Return_Rejected, payment_status: 'Paid' as any },
    { id: 210, name: 'Tháng 10', email: 'thang10@test.com', phone: '0900000040', address: 'Đà Nẵng', created_at: monthsAgoDay15(3), status: OrderStatus.Return_Requested, payment_status: 'Paid' as any },
    { id: 211, name: 'Tháng 11', email: 'thang11@test.com', phone: '0900000049', address: 'Cần Thơ', created_at: monthsAgoDay15(2), status: OrderStatus.Return_Approved, payment_status: 'Refunded' as any },
    { id: 212, name: 'Tháng 12', email: 'thang12@test.com', phone: '0900000050', address: 'Hải Phòng', created_at: monthsAgoDay15(1), status: OrderStatus.Return_Rejected, payment_status: 'Paid' as any }
  ];

  for (const o of ordersData) {
    await prisma.order.create({
      data: { id: o.id, name: o.name, email: o.email, phone: o.phone, address: o.address, total_price: 0, status: o.status, payment_status: (o as any).payment_status ?? 'Unpaid', created_at: o.created_at, delivered_at: o.status === OrderStatus.Delivered ? o.created_at : null },
    });
  }
  console.log('✔ Orders');

  const orderItemsData = [
    { order_id: 101, product_id: 1, quantity: 2, price: 150000 },
    { order_id: 102, product_id: 5, quantity: 2, price: 320000 },
    { order_id: 103, product_id: 9, quantity: 3, price: 150000 },
    { order_id: 104, product_id: 33, quantity: 2, price: 250000 },
    { order_id: 105, product_id: 25, quantity: 3, price: 200000 },
    { order_id: 106, product_id: 1, quantity: 4, price: 150000 },
    { order_id: 107, product_id: 9, quantity: 3, price: 150000 },
    { order_id: 108, product_id: 1, quantity: 3, price: 150000 },
    { order_id: 109, product_id: 25, quantity: 2, price: 200000 },
    { order_id: 110, product_id: 9, quantity: 4, price: 150000 },
    { order_id: 111, product_id: 5, quantity: 2, price: 320000 },
    { order_id: 112, product_id: 33, quantity: 3, price: 250000 },
    { order_id: 113, product_id: 1, quantity: 5, price: 150000 },
    { order_id: 114, product_id: 25, quantity: 2, price: 200000 },
    { order_id: 115, product_id: 9, quantity: 2, price: 150000 },
    { order_id: 116, product_id: 33, quantity: 2, price: 250000 },
    { order_id: 117, product_id: 5, quantity: 1, price: 320000 },
    { order_id: 118, product_id: 1, quantity: 4, price: 150000 },
    { order_id: 119, product_id: 25, quantity: 4, price: 200000 },
    { order_id: 120, product_id: 9, quantity: 2, price: 150000 },
    { order_id: 121, product_id: 1, quantity: 3, price: 150000 },
    { order_id: 122, product_id: 25, quantity: 2, price: 200000 },
    { order_id: 123, product_id: 33, quantity: 1, price: 250000 },
    { order_id: 124, product_id: 1, quantity: 2, price: 150000 },
    { order_id: 125, product_id: 25, quantity: 2, price: 200000 },
    { order_id: 126, product_id: 33, quantity: 1, price: 250000 },
    { order_id: 127, product_id: 9, quantity: 2, price: 150000 },
    { order_id: 128, product_id: 1, quantity: 3, price: 150000 },
    { order_id: 129, product_id: 25, quantity: 2, price: 200000 },
    { order_id: 130, product_id: 33, quantity: 1, price: 250000 },
    { order_id: 201, product_id: 1, quantity: 6, price: 150000 },
    { order_id: 202, product_id: 5, quantity: 4, price: 320000 },
    { order_id: 203, product_id: 1, quantity: 10, price: 150000 },
    { order_id: 204, product_id: 25, quantity: 8, price: 200000 },
    { order_id: 205, product_id: 33, quantity: 10, price: 250000 },
    { order_id: 206, product_id: 33, quantity: 10, price: 250000 },
    { order_id: 207, product_id: 25, quantity: 12, price: 200000 },
    { order_id: 208, product_id: 5, quantity: 8, price: 320000 },
    { order_id: 209, product_id: 1, quantity: 12, price: 150000 },
    { order_id: 210, product_id: 9, quantity: 8, price: 150000 },
    { order_id: 211, product_id: 9, quantity: 12, price: 150000 },
    { order_id: 212, product_id: 5, quantity: 10, price: 320000 }
  ];

  await prisma.orderItem.createMany({ data: orderItemsData });
  console.log('✔ Order items');

  const orderIds = [...new Set(orderItemsData.map((i) => i.order_id))];
  for (const orderId of orderIds) {
    const items = orderItemsData.filter((i) => i.order_id === orderId);
    const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    await prisma.order.update({ where: { id: orderId }, data: { total_price: total } });
  }

  // ============================================================
  // 12. RETURN REQUESTS
  // ============================================================
  await prisma.returnRequest.createMany({
    data: [
      { order_id: 201, reason_code: 'Damaged', status: ReturnStatus.Pending },
      { order_id: 202, reason_code: 'Wrong item', status: ReturnStatus.Approved },
      { order_id: 203, reason_code: 'Change mind', status: ReturnStatus.Rejected },
      { order_id: 204, reason_code: 'Not as described', status: ReturnStatus.Pending },
      { order_id: 205, reason_code: 'Damaged', status: ReturnStatus.Approved },
      { order_id: 206, reason_code: 'Wrong item', status: ReturnStatus.Rejected },
      { order_id: 207, reason_code: 'Change mind', status: ReturnStatus.Pending },
      { order_id: 208, reason_code: 'Not as described', status: ReturnStatus.Approved },
      { order_id: 209, reason_code: 'Damaged', status: ReturnStatus.Rejected },
      { order_id: 210, reason_code: 'Wrong item', status: ReturnStatus.Pending },
      { order_id: 211, reason_code: 'Change mind', status: ReturnStatus.Approved },
      { order_id: 212, reason_code: 'Not as described', status: ReturnStatus.Rejected },
    ],
  });
  console.log('✔ Return requests');

  // ============================================================
  // 13. USER PRODUCT INTERACTIONS
  // ============================================================
  await prisma.userProductInteraction.createMany({
    data: [
      { user_id: 3, product_id: 1, interaction_type: InteractionType.view },
      { user_id: 3, product_id: 1, interaction_type: InteractionType.add_to_cart },
      { user_id: 3, product_id: 1, interaction_type: InteractionType.purchase },
      { user_id: 3, product_id: 5, interaction_type: InteractionType.view },
      { user_id: 3, product_id: 5, interaction_type: InteractionType.purchase },
      { user_id: 5, product_id: 1, interaction_type: InteractionType.view },
      { user_id: 5, product_id: 1, interaction_type: InteractionType.add_to_cart },
      { user_id: 5, product_id: 2, interaction_type: InteractionType.purchase },
      { user_id: 8, product_id: 1, interaction_type: InteractionType.view },
      { user_id: 8, product_id: 5, interaction_type: InteractionType.view },
      { user_id: 8, product_id: 9, interaction_type: InteractionType.view },
      { user_id: 4, product_id: 13, interaction_type: InteractionType.purchase },
      { user_id: 4, product_id: 14, interaction_type: InteractionType.purchase },
      { user_id: 4, product_id: 17, interaction_type: InteractionType.add_to_cart },
      { user_id: 7, product_id: 13, interaction_type: InteractionType.purchase },
      { user_id: 7, product_id: 19, interaction_type: InteractionType.view },
      { user_id: 9, product_id: 13, interaction_type: InteractionType.view },
      { user_id: 9, product_id: 14, interaction_type: InteractionType.view },
      { user_id: 9, product_id: 15, interaction_type: InteractionType.view },
      { user_id: 9, product_id: 16, interaction_type: InteractionType.view },
      { user_id: 6, product_id: 25, interaction_type: InteractionType.purchase },
      { user_id: 6, product_id: 33, interaction_type: InteractionType.purchase },
      { user_id: 6, product_id: 26, interaction_type: InteractionType.view },
      { user_id: 11, product_id: 25, interaction_type: InteractionType.purchase },
      { user_id: 11, product_id: 27, interaction_type: InteractionType.add_to_cart },
      { user_id: 12, product_id: 33, interaction_type: InteractionType.purchase },
      { user_id: 12, product_id: 34, interaction_type: InteractionType.add_to_cart },
      { user_id: 10, product_id: 2, interaction_type: InteractionType.view },
      { user_id: 10, product_id: 25, interaction_type: InteractionType.view },
      { user_id: 10, product_id: 31, interaction_type: InteractionType.add_to_cart },
      { user_id: 11, product_id: 1, interaction_type: InteractionType.view },
      { user_id: 3, product_id: 25, interaction_type: InteractionType.view },
    ],
  });
  console.log('✔ User product interactions');

  console.log('🎉 Seed hoàn tất!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });