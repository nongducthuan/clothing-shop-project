DROP DATABASE IF EXISTS shopdb;
CREATE DATABASE shopdb;
USE shopdb;

-- ==============================================================================
-- 1. AUTHENTICATION & USERS
-- ==============================================================================

CREATE TABLE memberships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  min_spending DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('customer','admin') DEFAULT 'customer',
  total_spent DECIMAL(10,2) DEFAULT 0,
  membership_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (membership_id) REFERENCES memberships(id)
);

CREATE TABLE otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 2. PRODUCT CATALOG
-- ==============================================================================

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  gender ENUM('male','female','unisex') DEFAULT 'unisex',
  image_url VARCHAR(512) NULL
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  import_price DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (import_price >= 0),
  image_url VARCHAR(512),
  gender ENUM('male','female','unisex') NOT NULL DEFAULT 'unisex',
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_colors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  color_code VARCHAR(10) DEFAULT NULL,
  image_url VARCHAR(512) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_sizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  color_id INT NOT NULL,
  size ENUM('XS','S','M','L','XL','XXL') NOT NULL,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  extra_price DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (color_id) REFERENCES product_colors(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 3. MARKETING & PROMOTIONS
-- ==============================================================================

CREATE TABLE banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_url VARCHAR(500) NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  apply_scope ENUM('all', 'category', 'product') DEFAULT 'all',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  sale_id INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_sale (product_id, sale_id)
);

CREATE TABLE sale_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  category_id INT NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sale_category (sale_id, category_id)
);

CREATE TABLE vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_percent DECIMAL(5,2) CHECK (discount_percent BETWEEN 0 AND 100),
  max_discount_amount DECIMAL(10,2) DEFAULT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  usage_limit INT DEFAULT NULL,
  used_count INT DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  status TINYINT(1) DEFAULT 1 CHECK (status IN (0, 1)),
  apply_scope ENUM('all', 'category', 'product') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  voucher_id INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_voucher (product_id, voucher_id)
);

CREATE TABLE voucher_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_id INT NOT NULL,
  category_id INT NOT NULL,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY unique_voucher_category (voucher_id, category_id)
);

CREATE TABLE buy_x_get_y_promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    buy_product_id INT NOT NULL,
    buy_quantity INT NOT NULL CHECK (buy_quantity > 0),
    gift_product_id INT NOT NULL,
    gift_quantity INT NOT NULL CHECK (gift_quantity > 0),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    max_gift_per_order INT DEFAULT NULL,
    total_gift_limit INT DEFAULT NULL,
    priority INT DEFAULT 0,
    is_stackable BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'paused', 'expired') DEFAULT 'active',
    times_applied INT DEFAULT 0,
    total_gifts_issued INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buy_product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (gift_product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 4. ORDERS & TRANSACTIONS
-- ==============================================================================

CREATE TABLE orders (
   id INT AUTO_INCREMENT PRIMARY KEY,
   user_id INT DEFAULT NULL,
   voucher_id INT DEFAULT NULL,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL,
   phone VARCHAR(20) NOT NULL,
   address TEXT NOT NULL,
   total_price DECIMAL(10,2) DEFAULT 0 CHECK (total_price >= 0),
   status ENUM('Pending','Confirmed','Shipping','Delivered','Cancelled','Return Requested','Return Rejected','Return Approved') DEFAULT 'Pending',
   payment_method ENUM('cod', 'momo') DEFAULT 'cod',
   payment_status ENUM('Unpaid', 'Paid', 'Refunded') DEFAULT 'Unpaid',
   momo_order_id VARCHAR(255) NULL,
   momo_pay_url TEXT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
   FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  color_id INT DEFAULT NULL,
  size_id INT DEFAULT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  is_gift BOOLEAN DEFAULT FALSE,
  promotion_id INT DEFAULT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (color_id) REFERENCES product_colors(id),
  FOREIGN KEY (size_id) REFERENCES product_sizes(id),
  FOREIGN KEY (promotion_id) REFERENCES buy_x_get_y_promotions(id) ON DELETE SET NULL
);

CREATE TABLE promotion_usage_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    promotion_id INT NOT NULL,
    buy_quantity_used INT NOT NULL,
    gifts_awarded INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (promotion_id) REFERENCES buy_x_get_y_promotions(id) ON DELETE CASCADE
);

CREATE TABLE return_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    reason_code VARCHAR(255) NOT NULL,
    description TEXT,
    images JSON,
    refund_bank_info JSON,
    admin_response TEXT,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE (order_id)
);

CREATE TABLE revenues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_date DATE NOT NULL UNIQUE,
  total_sales DECIMAL(15,2) DEFAULT 0,
  total_orders INT DEFAULT 0
);

-- ==============================================================================
-- 5. RECOMMENDATION SYSTEM (USER INTERACTIONS)
-- ==============================================================================

CREATE TABLE user_product_interaction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  interaction_type ENUM('view', 'add_to_cart', 'purchase') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_upi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_upi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
