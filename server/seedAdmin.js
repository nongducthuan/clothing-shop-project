// seedAdmin.js
const pool = require("./src/db");
const bcrypt = require("bcryptjs");

async function seedAdmin() {
  const email = "admin@shop.com";
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  if (rows.length > 0) {
    console.log("✅ Admin account already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("123456", 10);
  await pool.query(
    "INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
    ["Admin", email, "0123456789", hashedPassword, "admin"]
  );
  console.log("✅ Admin account is created successfully!");
  process.exit();
}

seedAdmin();
