// prisma/seedAdmin.ts
import prisma from "./client";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seedAdmin() {
  const email = "admin@shop.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("✅ Admin account already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      phone: "0123456789",
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log("✅ Admin account created successfully!");
}

seedAdmin()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });