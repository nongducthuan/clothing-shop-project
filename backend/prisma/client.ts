import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

function getDbConfig() {
  const url = process.env.DATABASE_URL;
  if (url) {
    // mysql://user:password@host:port/database
    const match = url.match(/^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/);
    if (match) {
      return {
        host: match[3],
        port: Number(match[4]),
        user: match[1],
        password: decodeURIComponent(match[2]),
        database: match[5].split('?')[0], // bỏ query params nếu có
      };
    }
  }
  // Fallback: dùng biến môi trường riêng lẻ (localhost)
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopdb',
  };
}

// Tạo adapter kết nối MariaDB/MySQL
const adapter = new PrismaMariaDb({
  ...getDbConfig(),
  connectionLimit: 10,
});

// Singleton Prisma Client
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
} as any);

export default prisma;
