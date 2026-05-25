import knex from 'knex';
import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

let db: Knex | null = null;

export function initializeDatabase(): Knex {
  if (db) {
    return db;
  }

  const environment = process.env.NODE_ENV || 'development';

  db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'spotify_converter_dev',
      ssl: environment === 'production' ? true : false,
    },
    pool: {
      min: 10,
      max: 100,
    },
    acquireConnectionTimeout: 10000,
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      extension: 'ts',
    },
  });

  return db;
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}

export async function runMigrations(): Promise<void> {
  const database = getDatabase();
  await database.migrate.latest();
}

export async function rollbackMigrations(): Promise<void> {
  const database = getDatabase();
  await database.migrate.rollback();
}
