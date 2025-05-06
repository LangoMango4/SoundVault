import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function createTermsAcceptanceLogsTable() {
  try {
    console.log('Creating terms_acceptance_logs table...');
    
    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS terms_acceptance_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        acceptance_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        version TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT
      );
    `);
    
    console.log('Table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit(0);
  }
}

createTermsAcceptanceLogsTable();
