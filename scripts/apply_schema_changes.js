import { db, pool } from '../server/db.js';
import { userStrikes, chatModerationLogs } from '../shared/schema.js';

async function applySchemaChanges() {
  console.log('Creating chat moderation tables...');
  
  try {
    // Create user_strikes table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_strikes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        strikes_count INTEGER NOT NULL DEFAULT 0,
        is_chat_restricted BOOLEAN NOT NULL DEFAULT false,
        last_strike_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Created user_strikes table');
    
    // Create chat_moderation_logs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS chat_moderation_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        original_message TEXT NOT NULL,
        moderated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT NOT NULL,
        moderation_type TEXT NOT NULL
      );
    `);
    
    console.log('Created chat_moderation_logs table');
    console.log('Schema changes applied successfully!');
  } catch (error) {
    console.error('Error applying schema changes:', error);
  } finally {
    await pool.end();
  }
}

applySchemaChanges();
