/**
 * Script to run Better Auth + Drizzle migrations
 * This script is executed automatically during the Vercel build
 */

const { execSync } = require('child_process');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found. Skipping migrations (likely in development).');
      console.log('💡 In production (Vercel), make sure DATABASE_URL is configured.');
      return;
    }

    // Run Drizzle migrations
    console.log('📝 Running Drizzle migrations...');
    execSync('npx tsx drizzle/migrate.ts', { stdio: 'inherit' });
    console.log('✅ Drizzle migrations completed');

    console.log('🎉 All database migrations completed successfully');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    
    // In development, it's possible to continue without migrations
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: continuing build without migrations');
      return;
    }
    
    // In production, failed migrations should fail the build
    process.exit(1);
  }
}

runMigrations();
