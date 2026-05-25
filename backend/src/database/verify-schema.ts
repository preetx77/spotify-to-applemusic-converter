import { getDatabase } from './db';

/**
 * Verifies that all required tables and indexes exist in the database
 */
export async function verifySchema(): Promise<void> {
  const db = getDatabase();

  // List of required tables
  const requiredTables = [
    'users',
    'sessions',
    'playlists',
    'conversion_jobs',
    'song_matches',
    'audit_logs',
    'api_rate_limits',
  ];

  // Check if all tables exist
  const tables = await db.raw(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);

  const existingTables = tables.rows.map((row: any) => row.table_name);

  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      throw new Error(`Required table '${table}' does not exist`);
    }
  }

  console.log('✓ All required tables exist');

  // Verify key indexes
  const indexes = await db.raw(`
    SELECT tablename, indexname FROM pg_indexes 
    WHERE schemaname = 'public'
  `);

  const indexNames = indexes.rows.map((row: any) => row.indexname);

  // Check for critical indexes
  const criticalIndexes = [
    'users_spotify_user_id_unique',
    'users_email_unique',
    'sessions_session_token_unique',
    'sessions_user_id_idx',
    'playlists_user_id_idx',
    'conversion_jobs_user_id_idx',
    'conversion_jobs_status_idx',
    'song_matches_conversion_job_id_idx',
    'audit_logs_user_id_idx',
    'api_rate_limits_user_id_idx',
  ];

  for (const index of criticalIndexes) {
    if (!indexNames.includes(index)) {
      console.warn(`⚠ Expected index '${index}' not found`);
    }
  }

  console.log('✓ Schema verification complete');
}

/**
 * Prints schema information for debugging
 */
export async function printSchemaInfo(): Promise<void> {
  const db = getDatabase();

  const tables = await db.raw(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log('\n=== Database Tables ===');
  for (const row of tables.rows) {
    const columns = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [row.table_name]);

    console.log(`\n${row.table_name}:`);
    for (const col of columns.rows) {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
    }
  }

  const indexes = await db.raw(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);

  console.log('\n=== Indexes ===');
  for (const idx of indexes.rows) {
    console.log(`${idx.tablename}: ${idx.indexname}`);
  }
}
