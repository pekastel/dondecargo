import { defineConfig } from 'drizzle-kit';
import { env } from './lib/env';

export default defineConfig({
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  // Important: Do not use introspect or push in production with Better Auth
  migrations: {
    prefix: 'supabase', // or 'timestamp' to avoid conflicts
  },
});