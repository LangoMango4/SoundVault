import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

console.log("Starting database migration...");

// Create a direct connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addApprovalFieldToUsers() {
  console.log('Adding approval and registration_date fields to users table...');
  
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // First check if the column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'approved'
    `);
    
    if (checkResult.rows.length === 0) {
      // Add approved column with default value of true for existing users
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN approved BOOLEAN NOT NULL DEFAULT TRUE
      `);
      console.log('Added approved column to users table');
    } else {
      console.log('approved column already exists in users table');
    }
    
    // Check if registration_date column exists
    const checkDateResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'registration_date'
    `);
    
    if (checkDateResult.rows.length === 0) {
      // Add registration_date column with current timestamp as default for existing users
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN registration_date TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      console.log('Added registration_date column to users table');
    } else {
      console.log('registration_date column already exists in users table');
    }
    
    // Make sure admin user is approved
    await client.query(`
      UPDATE users 
      SET approved = TRUE 
      WHERE role = 'admin'
    `);
    console.log('Ensured admin user is approved');
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Execute the migration
addApprovalFieldToUsers()
  .then(() => {
    console.log('Migration completed, exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });