const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createMigrationsTable() {
  try {
    // Check if migrations table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('Creating migrations table...');
      await pool.query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Migrations table created.');
    }
  } catch (error) {
    console.error('Error creating migrations table:', error);
    process.exit(1);
  }
}

async function getAppliedMigrations() {
  try {
    const result = await pool.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting applied migrations:', error);
    return [];
  }
}

async function applyMigration(migrationFile) {
  const migrationPath = path.join(__dirname, migrationFile);
  const migrationName = path.basename(migrationFile);
  
  try {
    console.log(`Applying migration: ${migrationName}`);
    
    // Read and execute the SQL file
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pool.query(sql);
    
    // Record the migration in the migrations table
    await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migrationName]);
    
    console.log(`Migration ${migrationName} applied successfully.`);
  } catch (error) {
    console.error(`Error applying migration ${migrationName}:`, error);
    process.exit(1);
  }
}

async function runMigrations() {
  await createMigrationsTable();
  
  // Get all migration files
  const migrationFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations are applied in order
  
  // Get already applied migrations
  const appliedMigrations = await getAppliedMigrations();
  
  // Apply new migrations
  for (const migrationFile of migrationFiles) {
    if (!appliedMigrations.includes(migrationFile)) {
      await applyMigration(migrationFile);
    } else {
      console.log(`Migration ${migrationFile} already applied.`);
    }
  }
  
  console.log('All migrations applied successfully.');
  await pool.end();
}

// Run migrations
runMigrations().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
