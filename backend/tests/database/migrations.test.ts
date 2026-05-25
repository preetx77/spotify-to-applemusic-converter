import { initializeDatabase, closeDatabase, runMigrations } from '../../src/database';

describe('Database Migrations', () => {
  let db: any;

  beforeAll(() => {
    db = initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('should run migrations successfully', async () => {
    await runMigrations();
    
    // Verify tables exist
    const tables = await db.raw(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableNames = tables.rows.map((row: any) => row.table_name);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('playlists');
    expect(tableNames).toContain('conversion_jobs');
    expect(tableNames).toContain('song_matches');
    expect(tableNames).toContain('audit_logs');
    expect(tableNames).toContain('api_rate_limits');
  });

  test('should have correct columns in users table', async () => {
    const columns = await db.raw(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columnNames = columns.rows.map((row: any) => row.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('spotify_user_id');
    expect(columnNames).toContain('apple_music_user_id');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
    expect(columnNames).toContain('deleted_at');
  });

  test('should have correct columns in sessions table', async () => {
    const columns = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'sessions'
    `);
    
    const columnNames = columns.rows.map((row: any) => row.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('session_token');
    expect(columnNames).toContain('spotify_access_token');
    expect(columnNames).toContain('spotify_refresh_token');
    expect(columnNames).toContain('apple_music_token');
    expect(columnNames).toContain('expires_at');
  });

  test('should have correct columns in conversion_jobs table', async () => {
    const columns = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'conversion_jobs'
    `);
    
    const columnNames = columns.rows.map((row: any) => row.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('spotify_playlist_id');
    expect(columnNames).toContain('apple_music_playlist_id');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('total_songs');
    expect(columnNames).toContain('matched_songs');
    expect(columnNames).toContain('unmatched_songs');
    expect(columnNames).toContain('ambiguous_songs');
  });

  test('should have correct columns in song_matches table', async () => {
    const columns = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'song_matches'
    `);
    
    const columnNames = columns.rows.map((row: any) => row.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('conversion_job_id');
    expect(columnNames).toContain('spotify_song_id');
    expect(columnNames).toContain('spotify_song_title');
    expect(columnNames).toContain('apple_music_song_id');
    expect(columnNames).toContain('match_status');
    expect(columnNames).toContain('confidence_score');
  });

  test('should have correct columns in audit_logs table', async () => {
    const columns = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
    `);
    
    const columnNames = columns.rows.map((row: any) => row.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('action');
    expect(columnNames).toContain('resource_type');
    expect(columnNames).toContain('resource_id');
    expect(columnNames).toContain('details');
  });

  test('should have correct columns in api_rate_limits table', async () => {
    const columns = await db.raw(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'api_rate_limits'
    `);
    
    const columnNames = columns.rows.map((row: any) => row.column_name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('api_provider');
    expect(columnNames).toContain('request_count');
    expect(columnNames).toContain('window_start');
    expect(columnNames).toContain('window_end');
  });

  test('should have correct indexes on users table', async () => {
    const indexes = await db.raw(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'users'
    `);
    
    const indexNames = indexes.rows.map((row: any) => row.indexname);
    
    // Should have indexes for unique constraints
    expect(indexNames.length).toBeGreaterThan(0);
  });

  test('should have foreign key constraints', async () => {
    const constraints = await db.raw(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'sessions' AND constraint_type = 'FOREIGN KEY'
    `);
    
    expect(constraints.rows.length).toBeGreaterThan(0);
  });
});
