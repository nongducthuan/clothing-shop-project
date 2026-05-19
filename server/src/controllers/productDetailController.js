// controllers/productDetailController.js
const pool = require('../db');

async function getProductDetail(req, res) {
  try {
    const { id } = req.params;

    // 1️⃣ Lấy thông tin sản phẩm
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
    const product = products[0];

    // 2️⃣ Lấy màu của sản phẩm
    const [colors] = await pool.query('SELECT * FROM product_colors WHERE product_id = ?', [id]);

    // 3️⃣ Lấy size cho từng màu
    for (let color of colors) {
      const [sizes] = await pool.query('SELECT * FROM product_sizes WHERE color_id = ?', [color.id]);
      color.sizes = sizes;
    }

    // 4️⃣ Trả về JSON
    res.json({ ...product, colors });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getProductDetail };

