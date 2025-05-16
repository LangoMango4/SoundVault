import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';

dotenv.config();

// Create a direct database connection pool
const directPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addRegistrationIPtoUsers() {
  console.log('Adding registration_ip field to users table...');
  
  const client = await directPool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if the column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'registration_ip'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add registration_ip column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN registration_ip TEXT
      `);
      console.log('Added registration_ip column to users table');
    } else {
      console.log('registration_ip column already exists in users table');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration complete!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await directPool.end();
  }
}

// Run the migration
addRegistrationIPtoUsers().catch(console.error);