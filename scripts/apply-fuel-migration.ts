import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

async function applyMigration() {
  const connection = postgres(DATABASE_URL, { max: 1 })
  const db = drizzle(connection)

  try {
    console.log('Applying fuel station tables migration...')
    
    const migrationSQL = readFileSync(
      join(__dirname, 'apply-fuel-tables.sql'), 
      'utf-8'
    )

    // Split SQL statements and execute them one by one
    const statements = migrationSQL
      .split('--')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .join('')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 60)}...`)
        await connection.unsafe(statement)
      } catch (error: any) {
        if (error.code === '42P07') {
          console.log(`Table already exists, skipping: ${statement.substring(0, 60)}...`)
        } else if (error.code === '42710') {
          console.log(`Object already exists, skipping: ${statement.substring(0, 60)}...`)
        } else {
          throw error
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

applyMigration()