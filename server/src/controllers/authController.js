const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  createUser,
  updateUserPhone,
} = require("../models/userModel");
const pool = require("../db");

async function register(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Please enter all required information" });
    }

    const [existingEmail] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const [existingPhone] = await pool.query("SELECT id FROM users WHERE phone = ?", [phone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ message: "Phone number is already in use" });
    }

    // Khi tạo user, model của bạn nên mặc định membership_id = 1 (Bronze)
    const userId = await createUser(name, email, phone, password, "customer");

    res.status(201).json({
      message: "Registration successful",
      id: userId,
      email,
    });
  } catch (err) {
    console.error("❌ Error during registration:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please enter email/phone and password" });
    }

    // Thay vì dùng findUserByIdentifier đơn giản, 
    // ta lấy luôn thông tin Membership để trả về cho Frontend
    const [rows] = await pool.query(
      `SELECT u.*, m.name as tier_name, m.discount_percent 
       FROM users u 
       LEFT JOIN memberships m ON u.membership_id = m.id 
       WHERE u.email = ? OR u.phone = ?`,
      [identifier, identifier]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: "Incorrect account or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect account or password" });
    }

    // Thêm các thông tin hạng thành viên vào Token để dùng ở Middleware hoặc Frontend
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.tier_name, // Tên hạng: Gold, Silver...
        discount: user.discount_percent, // % giảm giá
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        total_spent: user.total_spent, // Trả về tổng chi tiêu
        tier_name: user.tier_name || "Bronze", // Mặc định nếu null
        discount_percent: user.discount_percent || 0,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Server error" });
  }
}

const updateProfile = async (req, res) => {
  const { phone } = req.body;
  const userId = req.user.id;

  try {
    if (!phone) {
      return res.status(400).json({ message: "Please enter phone number" });
    }

    await updateUserPhone(userId, phone);

    res.status(200).json({
      message: "Profile updated successfully!",
      user: {
        ...req.user,
        phone: phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error when updating profile" });
  }
};

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.total_spent, u.membership_id,
              m.name as tier_name, m.discount_percent 
       FROM users u 
       LEFT JOIN memberships m ON u.membership_id = m.id 
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    // Trả về rows[0], lúc này nó sẽ có tier_name là "Silver" (nếu membership_id = 2)
    res.json(rows[0]); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  register,
  login,
  updateProfile,
  getMe
};