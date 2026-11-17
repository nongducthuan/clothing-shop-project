import fs from 'fs';
import path from 'path';
import { getPostgresPoolConfig, POSTGRES_POOL_OPTIONS } from '../../utils/postgres';

describe('PostgreSQL connection configuration', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('uses a bounded connection pool', () => {
    expect(POSTGRES_POOL_OPTIONS.max).toBeGreaterThan(0);
    expect(POSTGRES_POOL_OPTIONS.max).toBeLessThanOrEqual(10);
    expect(POSTGRES_POOL_OPTIONS.connectionTimeoutMillis).toBeGreaterThanOrEqual(1000);
  });

  it('accepts a PostgreSQL URL and preserves its SSL/schema query parameters', () => {
    process.env.DATABASE_URL = 'postgresql://shop:pa%40ss@db.example.com:5432/shopdb?sslmode=require&schema=public';
    expect(getPostgresPoolConfig()).toMatchObject({
      connectionString: process.env.DATABASE_URL,
      max: POSTGRES_POOL_OPTIONS.max,
      idleTimeoutMillis: POSTGRES_POOL_OPTIONS.idleTimeoutMillis,
      connectionTimeoutMillis: POSTGRES_POOL_OPTIONS.connectionTimeoutMillis,
    });
  });

  it('rejects a MySQL URL to prevent accidental use of the old database', () => {
    process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/shopdb';
    expect(() => getPostgresPoolConfig()).toThrow(/postgresql:\/\/ or postgres:\/\//);
  });

  it('requires DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    expect(() => getPostgresPoolConfig()).toThrow(/DATABASE_URL is required/);
  });

  it('the app and seed both use PrismaPg and the shared PostgreSQL pool config', () => {
    const files = ['prisma/client.ts', 'prisma/seed.ts'];
    for (const file of files) {
      const source = fs.readFileSync(path.resolve(__dirname, '../../../', file), 'utf8');
      expect(source).toContain("from '@prisma/adapter-pg'");
      expect(source).toContain('getPostgresPoolConfig()');
    }
  });

  it('seed cleanup uses advisory locks, cascading truncation and sequence reset', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../prisma/seed.ts'), 'utf8');
    expect(source).toContain('pg_try_advisory_lock');
    expect(source).toContain('TRUNCATE TABLE');
    expect(source).toContain('RESTART IDENTITY CASCADE');
    expect(source).toContain('pg_get_serial_sequence');
  });
});
