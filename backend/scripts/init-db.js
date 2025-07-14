import { initDatabase } from '../database/init.js';

(async () => {
  try {
    await initDatabase();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
})(); 