import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, Gender, UserRole, SizeEnum, InteractionType, ReturnStatus, OrderStatus } from '../src/generated/prisma/client';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// Helper: ngày tương đối so với hôm nay (giống DATE_SUB(CURDATE(), INTERVAL n DAY))
function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

// Helper: ngày 15 của tháng cách hiện tại n tháng (giống DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH), '%Y-%m-15'))
function monthsAgoDay15(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(15);
  return d;
}

async function main() {
  console.log('Bắt đầu seed...');

  // ============================================================
  // 0. CLEANUP — xoá dữ liệu cũ theo thứ tự phụ thuộc ngược
  // ============================================================
  await prisma.userProductInteraction.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
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
      { name: 'Normal', min_spending: 0, discount_percent: 0 },
      { name: 'Bronze', min_spending: 5000000, discount_percent: 5 },
      { name: 'Silver', min_spending: 10000000, discount_percent: 10 },
      { name: 'Gold', min_spending: 15000000, discount_percent: 15 },
      { name: 'Diamond', min_spending: 20000000, discount_percent: 20 },
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

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: 'password123',
        role: UserRole.customer,
      },
    });
  }
  console.log('✔ Users');

  // ============================================================
  // 3. CATEGORIES
  // ============================================================
  const categoriesData = [
    { id: 1, name: 'Shirt', gender: Gender.male },
    { id: 2, name: 'Trousers/Pants', gender: Gender.male },
    { id: 3, name: 'Jacket/Hoodie', gender: Gender.male },
    { id: 4, name: 'Shirt', gender: Gender.female },
    { id: 5, name: 'T-shirt', gender: Gender.female },
    { id: 6, name: 'Trousers/Pants', gender: Gender.female },
    { id: 7, name: 'T-shirt', gender: Gender.unisex },
    { id: 8, name: 'Trousers/Pants', gender: Gender.unisex },
    { id: 9, name: 'Shorts', gender: Gender.unisex },
  ];

  for (const c of categoriesData) {
    await prisma.category.create({
      data: { id: c.id, name: c.name, gender: c.gender },
    });
  }
  console.log('✔ Categories');

  // ============================================================
  // 4. PRODUCTS
  // ============================================================
  const productsData: {
    id: number; name: string; description: string; price: number;
    import_price: number; image_url: string; category_id: number; gender: Gender;
  }[] = [
    { id: 1, name: 'Easy-Wear Shirt', description: 'Slim fit, wrinkle-resistant fabric, comfortable all day long', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-white.png', category_id: 1, gender: Gender.male },
    { id: 2, name: 'Lightweight Shirt', description: 'Wrinkle-resistant fabric, slim fit, suitable for all styles', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-blue.png', category_id: 1, gender: Gender.male },
    { id: 3, name: 'Classic Shirt', description: 'Regular fit design, wrinkle-resistant fabric', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-beige.png', category_id: 1, gender: Gender.male },
    { id: 4, name: 'Modern Shirt', description: 'Easy to wear, wrinkle-resistant fabric, comfortable for movement', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-black.png', category_id: 1, gender: Gender.male },
    { id: 5, name: 'Active Chino Pants', description: 'Light stretch khaki fabric, cool and comfortable', price: 320000, import_price: 220000, image_url: '/public/images/quan-chino-nam-beige.png', category_id: 2, gender: Gender.male },
    { id: 6, name: 'Youthful Chino Pants', description: 'Light stretch, comfortable for all activities', price: 320000, import_price: 220000, image_url: '/public/images/quan-chino-nam-blue.png', category_id: 2, gender: Gender.male },
    { id: 7, name: 'Classic Jeans', description: 'Cool fabric, style suitable for all seasons', price: 320000, import_price: 220000, image_url: '/public/images/quan-jean-nam-dark-gray.png', category_id: 2, gender: Gender.male },
    { id: 8, name: 'Comfortable Jeans', description: 'Designed to fit well, comfortable for the whole day', price: 320000, import_price: 220000, image_url: '/public/images/quan-jean-nam-light-blue.png', category_id: 2, gender: Gender.male },
    { id: 9, name: 'Warm Hoodie', description: 'Soft fleece, provides good warmth in all weather', price: 150000, import_price: 100000, image_url: '/public/images/ao-hoodie-nam-red.png', category_id: 3, gender: Gender.male },
    { id: 10, name: 'Stylish Hoodie', description: 'Super soft fleece, comfortable, easy to mix and match', price: 150000, import_price: 100000, image_url: '/public/images/ao-hoodie-nam-green.png', category_id: 3, gender: Gender.male },
    { id: 11, name: 'Active Hooded Windbreaker', description: 'Light warming, windproof material', price: 150000, import_price: 100000, image_url: '/public/images/ao-khoac-nam-blue.png', category_id: 3, gender: Gender.male },
    { id: 12, name: 'Youthful Hooded Windbreaker', description: 'Windproof material, comfortable for all activities', price: 150000, import_price: 100000, image_url: '/public/images/ao-khoac-nam-yellow.png', category_id: 3, gender: Gender.male },
    { id: 13, name: 'Lightweight Shirt', description: 'Cool linen fabric, comfortable all day long', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-white.png', category_id: 4, gender: Gender.female },
    { id: 14, name: 'Elegant Shirt', description: 'Cool linen fabric, elegant design', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-green.png', category_id: 4, gender: Gender.female },
    { id: 15, name: 'Breathable Shirt', description: 'Cool linen fabric, easy to mix and match', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-ke-soc-white.png', category_id: 4, gender: Gender.female },
    { id: 16, name: 'Easy-Wear Shirt', description: 'Cool linen fabric, suitable for all styles', price: 280000, import_price: 190000, image_url: '/public/images/ao-so-mi-nu-ke-soc-blue.png', category_id: 4, gender: Gender.female },
    { id: 17, name: 'Active Crew Neck T-shirt', description: 'Slightly fitted, breathable material', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-co-tron-nu-blue.png', category_id: 5, gender: Gender.female },
    { id: 18, name: 'Youthful Crew Neck T-shirt', description: 'Slightly fitted, provides comfort all day long', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-co-tron-nu-navy.png', category_id: 5, gender: Gender.female },
    { id: 19, name: 'Simple Cotton T-shirt', description: 'Slightly fitted style, easy to pair with various outfits', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-vai-cotton-nu-white.png', category_id: 5, gender: Gender.female },
    { id: 20, name: 'Elegant Cotton T-shirt', description: 'Regular fit, soft and comfortable material', price: 280000, import_price: 190000, image_url: '/public/images/ao-thun-vai-cotton-nu-black.png', category_id: 5, gender: Gender.female },
    { id: 21, name: 'Modern Gear Pants', description: 'Thin, light fabric, active design for all activities', price: 450000, import_price: 310000, image_url: '/public/images/quan-dai-gear-nu-beige.png', category_id: 6, gender: Gender.female },
    { id: 22, name: 'Comfortable Gear Pants', description: 'Light fabric material, suitable for outings', price: 450000, import_price: 310000, image_url: '/public/images/quan-dai-gear-nu-green.png', category_id: 6, gender: Gender.female },
    { id: 23, name: 'Feminine Knit Pants', description: 'Thin, light fabric, comfortable design, suitable for all situations', price: 450000, import_price: 310000, image_url: '/public/images/quan-det-kim-nu-gray.png', category_id: 6, gender: Gender.female },
    { id: 24, name: 'Elegant Knit Pants', description: 'Thin, light fabric, active design, suitable for various styles', price: 450000, import_price: 310000, image_url: '/public/images/quan-det-kim-nu-khaki.png', category_id: 6, gender: Gender.female },
    { id: 25, name: 'Basic Short Sleeve T-shirt', description: '100% cotton fabric, sweat-absorbent, comfortable all day', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-ngan-unisex-gray.png', category_id: 7, gender: Gender.unisex },
    { id: 26, name: 'Active Short Sleeve T-shirt', description: '100% cotton, breathable and good absorption', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png', category_id: 7, gender: Gender.unisex },
    { id: 27, name: 'Comfortable Long Sleeve T-shirt', description: '100% cotton material, soft and fast-absorbing', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-dai-unisex-blue.png', category_id: 7, gender: Gender.unisex },
    { id: 28, name: 'Basic Long Sleeve T-shirt', description: '100% cotton, simple design, cool and breathable', price: 200000, import_price: 140000, image_url: '/public/images/ao-thun-tay-dai-unisex-green.png', category_id: 7, gender: Gender.unisex },
    { id: 29, name: 'Practical Wide Leg Pants', description: 'Soft fabric, comfortable for all genders', price: 250000, import_price: 170000, image_url: '/public/images/quan-dai-unisex-beige.png', category_id: 8, gender: Gender.unisex },
    { id: 30, name: 'Active Wide Leg Pants', description: 'Comfortable material, suitable for all activities', price: 250000, import_price: 170000, image_url: '/public/images/quan-dai-unisex-green.png', category_id: 8, gender: Gender.unisex },
    { id: 31, name: 'Easy-Wear Jeans', description: 'Comfortable design, suitable for all styles', price: 250000, import_price: 170000, image_url: '/public/images/quan-jean-unisex-blue.png', category_id: 8, gender: Gender.unisex },
    { id: 32, name: 'Comfortable Jeans', description: 'Soft fabric, comfortable anytime, anywhere', price: 250000, import_price: 170000, image_url: '/public/images/quan-jean-unisex-black.png', category_id: 8, gender: Gender.unisex },
    { id: 33, name: 'Comfortable Shorts', description: 'Soft elastic waistband, cool for summer', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-gray.png', category_id: 9, gender: Gender.unisex },
    { id: 34, name: 'Easy-Wear Shorts', description: 'Comfortable elastic waistband, durable material', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-white.png', category_id: 9, gender: Gender.unisex },
    { id: 35, name: 'Stylish Shorts', description: 'Well-fitted elastic waistband, breathable material', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-green.png', category_id: 9, gender: Gender.unisex },
    { id: 36, name: 'Active Shorts', description: 'Comfortable elastic waistband, pleasant material', price: 250000, import_price: 170000, image_url: '/public/images/quan-short-unisex-navy.png', category_id: 9, gender: Gender.unisex },
    { id: 37, name: 'Striped Shirt', description: 'Sophisticated striped pattern, modern office style', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-stripe.png', category_id: 1, gender: Gender.male },
    { id: 38, name: 'Smoky Gray Shirt', description: 'Neutral gray color, easy to pair with dress pants', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-grey.png', category_id: 1, gender: Gender.male },
    { id: 39, name: 'Navy Blue Shirt', description: 'Masculine navy blue color, absorbent cotton fabric', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-navy.png', category_id: 1, gender: Gender.male },
    { id: 40, name: 'Linen Fabric Shirt', description: 'Cool linen material, suitable for summer', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-linen.png', category_id: 1, gender: Gender.male },
    { id: 41, name: 'Short Sleeve Shirt', description: 'Active and youthful short-sleeve design', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-short.png', category_id: 1, gender: Gender.male },
    { id: 42, name: 'Denim Shirt', description: 'Dusty style, personal and strong character', price: 150000, import_price: 100000, image_url: '/public/images/ao-so-mi-nam-denim.png', category_id: 1, gender: Gender.male },
  ];

  for (const p of productsData) {
    await prisma.product.create({ data: p });
  }
  console.log('✔ Products');

  // ============================================================
  // 5. PRODUCT COLORS
  // (Thứ tự tạo PHẢI giữ nguyên như SQL gốc, vì product_sizes bên dưới
  //  tham chiếu color theo đúng thứ tự chèn 1..72 của bản SQL gốc)
  // ============================================================
  const productColorsData = [
    { product_id: 1, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nam-white.png' },
    { product_id: 1, color_name: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nam-blue.png' },
    { product_id: 2, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nam-white.png' },
    { product_id: 2, color_name: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nam-blue.png' },
    { product_id: 3, color_name: 'Beige', color_code: '#C3B091', image_url: '/public/images/ao-so-mi-nam-beige.png' },
    { product_id: 3, color_name: 'Black', color_code: '#000000', image_url: '/public/images/ao-so-mi-nam-black.png' },
    { product_id: 4, color_name: 'Beige', color_code: '#C3B091', image_url: '/public/images/ao-so-mi-nam-beige.png' },
    { product_id: 4, color_name: 'Black', color_code: '#000000', image_url: '/public/images/ao-so-mi-nam-black.png' },
    { product_id: 5, color_name: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-chino-nam-beige.png' },
    { product_id: 5, color_name: 'Blue', color_code: '#0000FF', image_url: '/public/images/quan-chino-nam-blue.png' },
    { product_id: 6, color_name: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-chino-nam-beige.png' },
    { product_id: 6, color_name: 'Blue', color_code: '#0000FF', image_url: '/public/images/quan-chino-nam-blue.png' },
    { product_id: 7, color_name: 'Light Blue', color_code: '#e5ecf6', image_url: '/public/images/quan-jean-nam-light-blue.png' },
    { product_id: 7, color_name: 'Dark Gray', color_code: '#232227', image_url: '/public/images/quan-jean-nam-dark-gray.png' },
    { product_id: 8, color_name: 'Light Blue', color_code: '#e5ecf6', image_url: '/public/images/quan-jean-nam-light-blue.png' },
    { product_id: 8, color_name: 'Dark Gray', color_code: '#232227', image_url: '/public/images/quan-jean-nam-dark-gray.png' },
    { product_id: 9, color_name: 'Green', color_code: '#6f7c6b', image_url: '/public/images/ao-hoodie-nam-green.png' },
    { product_id: 9, color_name: 'Red', color_code: '#d74d55', image_url: '/public/images/ao-hoodie-nam-red.png' },
    { product_id: 10, color_name: 'Green', color_code: '#6f7c6b', image_url: '/public/images/ao-hoodie-nam-green.png' },
    { product_id: 10, color_name: 'Red', color_code: '#d74d55', image_url: '/public/images/ao-hoodie-nam-red.png' },
    { product_id: 11, color_name: 'Blue', color_code: '#007bff', image_url: '/public/images/ao-khoac-nam-blue.png' },
    { product_id: 11, color_name: 'Yellow', color_code: '#d4a017', image_url: '/public/images/ao-khoac-nam-yellow.png' },
    { product_id: 12, color_name: 'Blue', color_code: '#007bff', image_url: '/public/images/ao-khoac-nam-blue.png' },
    { product_id: 12, color_name: 'Yellow', color_code: '#d4a017', image_url: '/public/images/ao-khoac-nam-yellow.png' },
    { product_id: 13, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-white.png' },
    { product_id: 13, color_name: 'Green', color_code: '#A9E5BB', image_url: '/public/images/ao-so-mi-nu-green.png' },
    { product_id: 14, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-white.png' },
    { product_id: 14, color_name: 'Green', color_code: '#A9E5BB', image_url: '/public/images/ao-so-mi-nu-green.png' },
    { product_id: 15, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-ke-soc-white.png' },
    { product_id: 15, color_name: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nu-ke-soc-blue.png' },
    { product_id: 16, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-so-mi-nu-ke-soc-white.png' },
    { product_id: 16, color_name: 'Sky Blue', color_code: '#87CEEB', image_url: '/public/images/ao-so-mi-nu-ke-soc-blue.png' },
    { product_id: 17, color_name: 'Sky Blue', color_code: '#dce2f0', image_url: '/public/images/ao-thun-co-tron-nu-blue.png' },
    { product_id: 17, color_name: 'Navy', color_code: '#2b3b5d', image_url: '/public/images/ao-thun-co-tron-nu-navy.png' },
    { product_id: 18, color_name: 'Sky Blue', color_code: '#dce2f0', image_url: '/public/images/ao-thun-co-tron-nu-blue.png' },
    { product_id: 18, color_name: 'Navy', color_code: '#2b3b5d', image_url: '/public/images/ao-thun-co-tron-nu-navy.png' },
    { product_id: 19, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-thun-vai-cotton-nu-white.png' },
    { product_id: 19, color_name: 'Black', color_code: '#000000', image_url: '/public/images/ao-thun-vai-cotton-nu-black.png' },
    { product_id: 20, color_name: 'White', color_code: '#FFFFFF', image_url: '/public/images/ao-thun-vai-cotton-nu-white.png' },
    { product_id: 20, color_name: 'Black', color_code: '#000000', image_url: '/public/images/ao-thun-vai-cotton-nu-black.png' },
    { product_id: 21, color_name: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-dai-gear-nu-beige.png' },
    { product_id: 21, color_name: 'Dark Green', color_code: '#0A3D3B', image_url: '/public/images/quan-dai-gear-nu-green.png' },
    { product_id: 22, color_name: 'Beige', color_code: '#F5F5DC', image_url: '/public/images/quan-dai-gear-nu-beige.png' },
    { product_id: 22, color_name: 'Dark Green', color_code: '#0A3D3B', image_url: '/public/images/quan-dai-gear-nu-green.png' },
    { product_id: 23, color_name: 'Beige', color_code: '#b6a498', image_url: '/public/images/quan-det-kim-nu-khaki.png' },
    { product_id: 23, color_name: 'Gray', color_code: '#515055', image_url: '/public/images/quan-det-kim-nu-gray.png' },
    { product_id: 24, color_name: 'Beige', color_code: '#b6a498', image_url: '/public/images/quan-det-kim-nu-khaki.png' },
    { product_id: 24, color_name: 'Gray', color_code: '#515055', image_url: '/public/images/quan-det-kim-nu-gray.png' },
    { product_id: 25, color_name: 'Gray', color_code: '#c0c8d3', image_url: '/public/images/ao-thun-tay-ngan-unisex-gray.png' },
    { product_id: 25, color_name: 'Dark Gray', color_code: '#474b4e', image_url: '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png' },
    { product_id: 26, color_name: 'Gray', color_code: '#c0c8d3', image_url: '/public/images/ao-thun-tay-ngan-unisex-gray.png' },
    { product_id: 26, color_name: 'Dark Gray', color_code: '#474b4e', image_url: '/public/images/ao-thun-tay-ngan-unisex-dark-gray.png' },
    { product_id: 27, color_name: 'Dark Blue', color_code: '#2c3546', image_url: '/public/images/ao-thun-tay-dai-unisex-blue.png' },
    { product_id: 27, color_name: 'Light Green', color_code: '#b3b6af', image_url: '/public/images/ao-thun-tay-dai-unisex-green.png' },
    { product_id: 28, color_name: 'Dark Blue', color_code: '#2c3546', image_url: '/public/images/ao-thun-tay-dai-unisex-blue.png' },
    { product_id: 28, color_name: 'Light Green', color_code: '#b3b6af', image_url: '/public/images/ao-thun-tay-dai-unisex-green.png' },
    { product_id: 29, color_name: 'Green', color_code: '#5a6151', image_url: '/public/images/quan-dai-unisex-green.png' },
    { product_id: 29, color_name: 'Beige', color_code: '#cab99f', image_url: '/public/images/quan-dai-unisex-beige.png' },
    { product_id: 30, color_name: 'Green', color_code: '#5a6151', image_url: '/public/images/quan-dai-unisex-green.png' },
    { product_id: 30, color_name: 'Beige', color_code: '#cab99f', image_url: '/public/images/quan-dai-unisex-beige.png' },
    { product_id: 31, color_name: 'Blue', color_code: '#1B4F72', image_url: '/public/images/quan-jean-unisex-blue.png' },
    { product_id: 31, color_name: 'Black', color_code: '#333333', image_url: '/public/images/quan-jean-unisex-black.png' },
    { product_id: 32, color_name: 'Blue', color_code: '#1B4F72', image_url: '/public/images/quan-jean-unisex-blue.png' },
    { product_id: 32, color_name: 'Black', color_code: '#333333', image_url: '/public/images/quan-jean-unisex-black.png' },
    { product_id: 33, color_name: 'White', color_code: '#f1f0ee', image_url: '/public/images/quan-short-unisex-white.png' },
    { product_id: 33, color_name: 'Gray', color_code: '#646b7d', image_url: '/public/images/quan-short-unisex-gray.png' },
    { product_id: 34, color_name: 'White', color_code: '#f1f0ee', image_url: '/public/images/quan-short-unisex-white.png' },
    { product_id: 34, color_name: 'Gray', color_code: '#646b7d', image_url: '/public/images/quan-short-unisex-gray.png' },
    { product_id: 35, color_name: 'Green', color_code: '#696C52', image_url: '/public/images/quan-short-unisex-green.png' },
    { product_id: 35, color_name: 'Navy', color_code: '#2C3243', image_url: '/public/images/quan-short-unisex-navy.png' },
    { product_id: 36, color_name: 'Green', color_code: '#696C52', image_url: '/public/images/quan-short-unisex-green.png' },
    { product_id: 36, color_name: 'Navy', color_code: '#2C3243', image_url: '/public/images/quan-short-unisex-navy.png' },
  ];

  // Lưu lại id thật do DB cấp phát, index 0 => color gốc số 1, index 71 => color gốc số 72
  const colorIdMap: number[] = [];
  for (const c of productColorsData) {
    const created = await prisma.productColor.create({ data: c });
    colorIdMap.push(created.id);
  }
  console.log('✔ Product colors');

  // ============================================================
  // 6. PRODUCT SIZES
  // (color_id dưới đây là số thứ tự GỐC 1..72 trong bảng product_colors ở SQL,
  //  sẽ được map sang id thật qua colorIdMap)
  // ============================================================
  const productSizesRaw: [number, SizeEnum, number][] = [
    [1,'S',10],[1,'M',20],[1,'L',15],
    [2,'S',8],[2,'M',18],[2,'L',12],
    [3,'S',10],[3,'M',15],[3,'L',12],
    [4,'S',5],[4,'M',8],[4,'L',10],
    [5,'S',10],[5,'M',8],[5,'L',5],
    [6,'S',12],[6,'M',10],[6,'L',6],
    [7,'S',7],[7,'M',14],[7,'L',9],
    [8,'S',6],[8,'M',12],[8,'L',8],
    [9,'S',15],[9,'M',20],[9,'L',10],
    [10,'S',12],[10,'M',18],[10,'L',10],
    [11,'S',10],[11,'M',15],[11,'L',12],
    [12,'S',8],[12,'M',12],[12,'L',10],
    [13,'S',10],[13,'M',20],[13,'L',15],
    [14,'S',8],[14,'M',18],[14,'L',12],
    [15,'S',8],[15,'M',15],[15,'L',12],
    [16,'S',6],[16,'M',12],[16,'L',10],
    [17,'S',10],[17,'M',15],[17,'L',10],
    [18,'S',8],[18,'M',14],[18,'L',12],
    [19,'S',7],[19,'M',14],[19,'L',10],
    [20,'S',5],[20,'M',10],[20,'L',8],
    [21,'S',10],[21,'M',15],[21,'L',12],
    [22,'S',8],[22,'M',12],[22,'L',10],
    [23,'S',12],[23,'M',10],[23,'L',8],
    [24,'S',10],[24,'M',14],[24,'L',10],
    [25,'S',10],[25,'M',20],[25,'L',15],
    [26,'S',8],[26,'M',18],[26,'L',12],
    [27,'S',10],[27,'M',15],[27,'L',12],
    [28,'S',5],[28,'M',8],[28,'L',10],
    [29,'S',10],[29,'M',8],[29,'L',5],
    [30,'S',12],[30,'M',10],[30,'L',6],
    [31,'S',7],[31,'M',14],[31,'L',9],
    [32,'S',6],[32,'M',12],[32,'L',8],
    [33,'S',15],[33,'M',20],[33,'L',10],
    [34,'S',12],[34,'M',18],[34,'L',10],
    [35,'S',10],[35,'M',15],[35,'L',12],
    [36,'S',8],[36,'M',12],[36,'L',10],
    [37,'S',10],[37,'M',20],[37,'L',15],
    [38,'S',8],[38,'M',18],[38,'L',12],
    [39,'S',10],[39,'M',15],[39,'L',12],
    [40,'S',5],[40,'M',8],[40,'L',10],
    [41,'S',10],[41,'M',8],[41,'L',5],
    [42,'S',12],[42,'M',10],[42,'L',6],
    [43,'S',7],[43,'M',14],[43,'L',9],
    [44,'S',6],[44,'M',12],[44,'L',8],
    [45,'S',15],[45,'M',20],[45,'L',10],
    [46,'S',12],[46,'M',18],[46,'L',10],
    [47,'S',10],[47,'M',15],[47,'L',12],
    [48,'S',8],[48,'M',12],[48,'L',10],
    [49,'S',10],[49,'M',20],[49,'L',15],
    [50,'S',8],[50,'M',18],[50,'L',12],
    [51,'S',8],[51,'M',15],[51,'L',12],
    [52,'S',6],[52,'M',12],[52,'L',10],
    [53,'S',10],[53,'M',15],[53,'L',10],
    [54,'S',8],[54,'M',14],[54,'L',12],
    [55,'S',7],[55,'M',14],[55,'L',10],
    [56,'S',5],[56,'M',10],[56,'L',8],
    [57,'S',10],[57,'M',15],[57,'L',12],
    [58,'S',8],[58,'M',12],[58,'L',10],
    [59,'S',12],[59,'M',10],[59,'L',8],
    [60,'S',10],[60,'M',14],[60,'L',10],
    [61,'S',10],[61,'M',20],[61,'L',15],
    [62,'S',8],[62,'M',18],[62,'L',12],
    [63,'S',10],[63,'M',15],[63,'L',12],
    [64,'S',5],[64,'M',8],[64,'L',10],
    [65,'S',10],[65,'M',8],[65,'L',5],
    [66,'S',12],[66,'M',10],[66,'L',6],
    [67,'S',7],[67,'M',14],[67,'L',9],
    [68,'S',6],[68,'M',12],[68,'L',8],
    [69,'S',15],[69,'M',20],[69,'L',10],
    [70,'S',12],[70,'M',18],[70,'L',10],
    [71,'S',10],[71,'M',15],[71,'L',12],
    [72,'S',8],[72,'M',12],[72,'L',10],
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
      { image_url: '/public/images/banner1.png', title: 'Welcome to Clothing Shop', subtitle: 'The latest collection is here – Up to 50% off today!' },
      { image_url: '/public/images/banner2.png', title: 'New Style Every Day', subtitle: 'Discover the hottest trending clothing models' },
      { image_url: '/public/images/banner3.png', title: 'New Arrivals Every Week', subtitle: "Continuously updated – don't miss the latest trends" },
      { image_url: '/public/images/banner4.png', title: 'Special Weekend Offer', subtitle: 'Get an extra 20% off your first order – Shop now!' },
    ],
  });
  console.log('✔ Banners');

  // ============================================================
  // 8. ORDERS & ORDER ITEMS
  // ============================================================
  const ordersData = [
    { id: 200, name: 'Nguyễn Văn A', email: 'a@test.com', phone: '0901', address: 'Hà Nội', created_at: daysAgo(6) },
    { id: 201, name: 'Trần Thị B', email: 'b@test.com', phone: '0902', address: 'TP HCM', created_at: daysAgo(5) },
    { id: 202, name: 'Lê Văn C', email: 'c@test.com', phone: '0903', address: 'Đà Nẵng', created_at: daysAgo(4) },
    { id: 203, name: 'Phạm Thị D', email: 'd@test.com', phone: '0904', address: 'Cần Thơ', created_at: daysAgo(3) },
    { id: 204, name: 'Hoàng Văn E', email: 'e@test.com', phone: '0905', address: 'Hải Phòng', created_at: daysAgo(2) },
    { id: 205, name: 'Vũ Thị F', email: 'f@test.com', phone: '0906', address: 'Nha Trang', created_at: daysAgo(1) },
    { id: 206, name: 'Đặng Văn G', email: 'g@test.com', phone: '0907', address: 'Huế', created_at: daysAgo(0) },
    { id: 301, name: 'Tháng 1', email: 't1@t.com', phone: '090', address: 'A', created_at: monthsAgoDay15(11) },
    { id: 302, name: 'Tháng 2', email: 't2@t.com', phone: '090', address: 'B', created_at: monthsAgoDay15(10) },
    { id: 303, name: 'Tháng 3', email: 't3@t.com', phone: '090', address: 'C', created_at: monthsAgoDay15(9) },
    { id: 304, name: 'Tháng 4', email: 't4@t.com', phone: '090', address: 'D', created_at: monthsAgoDay15(8) },
    { id: 305, name: 'Tháng 5', email: 't5@t.com', phone: '090', address: 'E', created_at: monthsAgoDay15(7) },
    { id: 306, name: 'Tháng 6', email: 't6@t.com', phone: '090', address: 'F', created_at: monthsAgoDay15(6) },
    { id: 307, name: 'Tháng 7', email: 't7@t.com', phone: '090', address: 'G', created_at: monthsAgoDay15(5) },
    { id: 308, name: 'Tháng 8', email: 't8@t.com', phone: '090', address: 'H', created_at: monthsAgoDay15(4) },
    { id: 309, name: 'Tháng 9', email: 't9@t.com', phone: '090', address: 'I', created_at: monthsAgoDay15(3) },
    { id: 310, name: 'Tháng 10', email: 't10@t.com', phone: '090', address: 'J', created_at: monthsAgoDay15(2) },
    { id: 311, name: 'Tháng 11', email: 't11@t.com', phone: '090', address: 'K', created_at: monthsAgoDay15(1) },
    { id: 312, name: 'Tháng 12', email: 't12@t.com', phone: '090', address: 'L', created_at: monthsAgoDay15(0) },
  ];

  for (const o of ordersData) {
    await prisma.order.create({
      data: {
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        address: o.address,
        total_price: 0,
        status: OrderStatus.Delivered,
        created_at: o.created_at,
      },
    });
  }
  console.log('✔ Orders');

  const orderItemsData: { order_id: number; product_id: number; quantity: number; price: number }[] = [
    { order_id: 200, product_id: 1, quantity: 2, price: 150000 },
    { order_id: 201, product_id: 5, quantity: 1, price: 320000 },
    { order_id: 202, product_id: 9, quantity: 3, price: 150000 },
    { order_id: 203, product_id: 33, quantity: 4, price: 250000 },
    { order_id: 204, product_id: 25, quantity: 2, price: 200000 },
    { order_id: 205, product_id: 1, quantity: 5, price: 150000 },
    { order_id: 206, product_id: 9, quantity: 2, price: 150000 },
    { order_id: 301, product_id: 1, quantity: 5, price: 150000 },
    { order_id: 302, product_id: 5, quantity: 4, price: 320000 },
    { order_id: 303, product_id: 1, quantity: 8, price: 150000 },
    { order_id: 304, product_id: 25, quantity: 10, price: 200000 },
    { order_id: 305, product_id: 33, quantity: 12, price: 250000 },
    { order_id: 306, product_id: 33, quantity: 25, price: 250000 },
    { order_id: 307, product_id: 25, quantity: 20, price: 200000 },
    { order_id: 308, product_id: 5, quantity: 15, price: 320000 },
    { order_id: 309, product_id: 1, quantity: 12, price: 150000 },
    { order_id: 310, product_id: 9, quantity: 8, price: 150000 },
    { order_id: 311, product_id: 9, quantity: 30, price: 150000 },
    { order_id: 312, product_id: 5, quantity: 10, price: 320000 },
  ];

  await prisma.orderItem.createMany({ data: orderItemsData });
  console.log('✔ Order items');

  // Cập nhật total_price = SUM(quantity * price) cho từng order (giống UPDATE ... trong SQL)
  const orderIds = [...new Set(orderItemsData.map((i) => i.order_id))];
  for (const orderId of orderIds) {
    const items = orderItemsData.filter((i) => i.order_id === orderId);
    const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    await prisma.order.update({
      where: { id: orderId },
      data: { total_price: total },
    });
  }
  console.log('✔ Cập nhật total_price cho orders');

  // ============================================================
  // 9. RETURN REQUESTS
  // ============================================================
  await prisma.returnRequest.createMany({
    data: [
      { order_id: 301, reason_code: 'Damaged', status: ReturnStatus.Pending },
      { order_id: 302, reason_code: 'Wrong item', status: ReturnStatus.Pending },
      { order_id: 303, reason_code: 'Change mind', status: ReturnStatus.Pending },
      { order_id: 304, reason_code: 'Not as described', status: ReturnStatus.Pending },
      { order_id: 305, reason_code: 'Damaged', status: ReturnStatus.Approved },
      { order_id: 306, reason_code: 'Wrong item', status: ReturnStatus.Approved },
      { order_id: 307, reason_code: 'Change mind', status: ReturnStatus.Approved },
      { order_id: 308, reason_code: 'Not as described', status: ReturnStatus.Approved },
      { order_id: 309, reason_code: 'Damaged', status: ReturnStatus.Rejected },
      { order_id: 310, reason_code: 'Wrong item', status: ReturnStatus.Rejected },
      { order_id: 311, reason_code: 'Change mind', status: ReturnStatus.Rejected },
      { order_id: 312, reason_code: 'Not as described', status: ReturnStatus.Rejected },
    ],
  });
  console.log('✔ Return requests');

  // ============================================================
  // 10. USER PRODUCT INTERACTIONS
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });