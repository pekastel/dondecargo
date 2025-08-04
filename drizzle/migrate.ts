import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { resolve } from 'path';
import { env } from '@/lib/env';

// We don't need dotenv/config because the variables are already available on Vercel

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  console.log('Running Drizzle migrations...');
  
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  try {
    // Use absolute path for migrations
    const migrationsPath = resolve(process.cwd(), 'drizzle/migrations');
    console.log(`Looking for migrations in: ${migrationsPath}`);
    
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('Drizzle migrations completed successfully');
  } catch (error) {
    console.error('Error running Drizzle migrations:', error);
    // Log more error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();