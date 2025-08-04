import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local first, then .env
config({ path: join(process.cwd(), '.env.local') });
config({ path: join(process.cwd(), '.env') });

import { db } from '../drizzle/connection';

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : '❌ Not set');
  
  if (process.env.DATABASE_URL) {
    // Parse URL to show connection details (without password)
    try {
      const url = new URL(process.env.DATABASE_URL);
      console.log('  Host:', url.hostname);
      console.log('  Port:', url.port || '5432');
      console.log('  Database:', url.pathname.slice(1));
      console.log('  Username:', url.username || '❌ Not set');
      console.log('  Password:', url.password ? '✅ Set' : '❌ Not set');
    } catch (e) {
      console.log('  ❌ Invalid DATABASE_URL format');
    }
  }
  
  console.log('');
  
  try {
    // Test basic connection
    console.log('🔌 Testing connection...');
    await db.execute('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    // Test if tables exist
    console.log('');
    console.log('📋 Checking tables...');
    
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('clients', 'projects', 'time_entries', 'user')
      ORDER BY table_name
    `);
    
    console.log('Available tables:', tables.rows.map(r => r.table_name).join(', '));
    
    if (tables.rows.length < 4) {
      console.log('⚠️  Some tables are missing. You may need to run migrations:');
      console.log('  pnpm db:migrate');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting tips:');
    console.log('1. Check your DATABASE_URL format:');
    console.log('   postgresql://username:password@host:port/database');
    console.log('2. Ensure the database server is running');
    console.log('3. Verify credentials and network access');
    console.log('4. Check if the database exists');
    process.exit(1);
  }
}

testConnection()
  .then(() => {
    console.log('✅ Connection test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  });