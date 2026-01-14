import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Create database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'budget_analyzer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  console.log(`📍 Connecting to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'budget_analyzer'}`);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Migration 001: Create schema
    console.log('\n📝 Running Migration 001: Create Schema...');
    const migration001 = readFileSync(
      resolve(__dirname, '../migrations/001_create_schema.sql'),
      'utf8'
    );
    await pool.query(migration001);
    console.log('✅ Migration 001 complete (tables created)');

    // Migration 002: Add default categories
    console.log('\n📝 Running Migration 002: Add Default Categories...');
    const migration002 = readFileSync(
      resolve(__dirname, '../migrations/002_add_default_categories.sql'),
      'utf8'
    );
    await pool.query(migration002);
    console.log('✅ Migration 002 complete (trigger created)');

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n📊 Database tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n✅ All migrations completed successfully! 🎉\n');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
