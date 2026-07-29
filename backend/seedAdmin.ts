import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
});

const prisma = new PrismaClient({
  adapter,
});

async function seedAdmin() {
  const email = "admin@shop.com";

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email,
    },
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