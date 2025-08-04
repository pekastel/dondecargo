import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { env } from '@/lib/env';

// Create connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

export type DbConnection = typeof db;