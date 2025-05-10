import { pool } from '../server/db.js';

// Fix for ESM imports when running directly
// If this doesn't work, we'll use the CommonJS approach below
try {
  if (!pool) {
    // CommonJS fallback
    const { pool: dbPool } = require('../server/db');
    globalThis.pool = dbPool;
  }
} catch (e) {
  console.warn('Error importing pool:', e);
  // Further fallback if needed
}

async function addMessageDismissedFields() {
  try {
    console.log('Starting migration to add isDeleted and dismissedBy fields to broadcast_messages...');
    
    // Check if the columns already exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'broadcast_messages' 
      AND column_name IN ('is_deleted', 'dismissed_by');
    `;
    
    const { rows: existingColumns } = await pool.query(checkColumnsQuery);
    const existingColumnNames = existingColumns.map(col => col.column_name);
    
    // Add is_deleted column if it doesn't exist
    if (!existingColumnNames.includes('is_deleted')) {
      console.log('Adding is_deleted column...');
      await pool.query(`
        ALTER TABLE broadcast_messages 
        ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
      `);
      console.log('is_deleted column added successfully');
    } else {
      console.log('is_deleted column already exists');
    }
    
    // Add dismissed_by column if it doesn't exist
    if (!existingColumnNames.includes('dismissed_by')) {
      console.log('Adding dismissed_by column...');
      await pool.query(`
        ALTER TABLE broadcast_messages 
        ADD COLUMN dismissed_by JSONB NOT NULL DEFAULT '[]';
      `);
      console.log('dismissed_by column added successfully');
    } else {
      console.log('dismissed_by column already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

addMessageDismissedFields()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });