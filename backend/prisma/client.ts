import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { getMariaDbPoolConfig } from '../src/utils/mariadbPool';

// Tham số pool nằm ở src/utils/mariadbPool.ts — KHÔNG đặt minimumIdle: 0 (gây P2039 pool timeout).
const adapter = new PrismaMariaDb(getMariaDbPoolConfig());

// Singleton: giữ 1 pool duy nhất qua các lần hot-reload của tsx watch.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
