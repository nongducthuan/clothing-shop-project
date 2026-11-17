import 'dotenv/config';
import type { PoolConfig } from 'pg';

/** Shared connection-pool configuration for PrismaPg and seed cleanup. */
export const POSTGRES_POOL_OPTIONS = {
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 20_000,
} as const;

/** Read the PostgreSQL connection string from DATABASE_URL. */
export function getPostgresPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is required and must point to a PostgreSQL database.');
  }

  if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    throw new Error('DATABASE_URL must use the postgresql:// or postgres:// scheme.');
  }

  return {
    connectionString,
    ...POSTGRES_POOL_OPTIONS,
  };
}
