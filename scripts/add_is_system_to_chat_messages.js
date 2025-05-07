import { db, pool } from '../server/db.ts';

async function addIsSystemToChatMessages() {
  console.log('Adding is_system column to chat_messages table...');
  
  try {
    // Check if column exists before adding
    const columnCheck = await db.execute(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'chat_messages' AND column_name = 'is_system';
    `);
    
    if (columnCheck.rowCount === 0) {
      // Add is_system column if it doesn't exist
      await db.execute(`
        ALTER TABLE chat_messages 
        ADD COLUMN is_system BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('Added is_system column to chat_messages table');
    } else {
      console.log('is_system column already exists in chat_messages table');
    }
    
    console.log('Database update completed successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

addIsSystemToChatMessages();