import 'dotenv/config';

export type MariaDbConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export type MariaDbPoolConfig = MariaDbConnectionConfig & {
  ssl: { rejectUnauthorized: boolean };
  connectionLimit: number;
  minimumIdle: number;
  acquireTimeout: number;
  connectTimeout: number;
  idleTimeout: number;
  keepAliveDelay: number;
};

export const MARIADB_SSL = { rejectUnauthorized: false } as const;

export const MARIADB_POOL_OPTIONS = {
  connectionLimit: 5,
  minimumIdle: 1,
  acquireTimeout: 30000,
  connectTimeout: 20000,
  idleTimeout: 240,
  keepAliveDelay: 10000,
} as const;

const URL_RE = /^(?:mysql|mariadb):\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/([^?]+)/;

export function getDbConfig(): MariaDbConnectionConfig {
  const url = process.env.DATABASE_URL;
  if (url) {
    const match = url.match(URL_RE);
    if (match) {
      return {
        host: match[3],
        port: Number(match[4]),
        user: match[1],
        password: decodeURIComponent(match[2]),
        database: match[5],
      };
    }
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopdb',
  };
}

export function getMariaDbPoolConfig(): MariaDbPoolConfig {
  return {
    ...getDbConfig(),
    ssl: { ...MARIADB_SSL },
    ...MARIADB_POOL_OPTIONS,
  };
}
