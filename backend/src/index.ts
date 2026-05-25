import dotenv from 'dotenv';
import { initializeDatabase, runMigrations } from './database';

dotenv.config();

async function main() {
  try {
    console.log('Initializing database...');
    initializeDatabase();
    
    console.log('Running migrations...');
    await runMigrations();
    
    console.log('Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

export { initializeDatabase, runMigrations };
