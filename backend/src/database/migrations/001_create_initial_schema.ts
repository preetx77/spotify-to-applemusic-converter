import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('spotify_user_id', 255).unique().notNullable();
    table.string('apple_music_user_id', 255).unique().nullable();
    table.string('email', 255).unique().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
    
    table.index('spotify_user_id');
    table.index('apple_music_user_id');
  });

  // Create sessions table
  await knex.schema.createTable('sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('session_token', 255).unique().notNullable();
    table.text('spotify_access_token').nullable();
    table.text('spotify_refresh_token').nullable();
    table.timestamp('spotify_token_expires_at').nullable();
    table.text('apple_music_token').nullable();
    table.timestamp('apple_music_token_expires_at').nullable();
    table.specificType('ip_address', 'inet').nullable();
    table.text('user_agent').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable();
    table.timestamp('last_activity_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('session_token');
    table.index('expires_at');
  });

  // Create playlists table
  await knex.schema.createTable('playlists', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('spotify_playlist_id', 255).notNullable();
    table.string('spotify_playlist_name', 255).notNullable();
    table.text('spotify_playlist_description').nullable();
    table.text('spotify_playlist_image_url').nullable();
    table.boolean('spotify_playlist_public').defaultTo(false);
    table.integer('song_count').notNullable();
    table.timestamp('cached_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('spotify_playlist_id');
    table.unique(['user_id', 'spotify_playlist_id']);
  });

  // Create conversion_jobs table
  await knex.schema.createTable('conversion_jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('spotify_playlist_id', 255).notNullable();
    table.string('apple_music_playlist_id', 255).nullable();
    table.string('apple_music_playlist_name', 255).nullable();
    table.string('status', 50).notNullable().defaultTo('pending');
    table.integer('total_songs').notNullable();
    table.integer('matched_songs').defaultTo(0);
    table.integer('unmatched_songs').defaultTo(0);
    table.integer('ambiguous_songs').defaultTo(0);
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    table.text('error_message').nullable();
    table.integer('retry_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('status');
    table.index('created_at');
  });

  // Create song_matches table
  await knex.schema.createTable('song_matches', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('conversion_job_id').notNullable().references('id').inTable('conversion_jobs').onDelete('CASCADE');
    table.string('spotify_song_id', 255).notNullable();
    table.string('spotify_song_title', 255).notNullable();
    table.string('spotify_song_artist', 255).notNullable();
    table.string('spotify_song_album', 255).nullable();
    table.string('apple_music_song_id', 255).nullable();
    table.string('apple_music_song_title', 255).nullable();
    table.string('apple_music_song_artist', 255).nullable();
    table.string('match_status', 50).notNullable();
    table.decimal('confidence_score', 3, 2).nullable();
    table.text('match_reason').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('conversion_job_id');
    table.index('match_status');
  });

  // Create audit_logs table
  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 255).notNullable();
    table.string('resource_type', 100).notNullable();
    table.string('resource_id', 255).nullable();
    table.jsonb('details').nullable();
    table.specificType('ip_address', 'inet').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('action');
    table.index('created_at');
  });

  // Create api_rate_limits table
  await knex.schema.createTable('api_rate_limits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('api_provider', 50).notNullable();
    table.integer('request_count').defaultTo(0);
    table.timestamp('window_start').notNullable();
    table.timestamp('window_end').notNullable();
    
    table.unique(['user_id', 'api_provider', 'window_start']);
    table.index('user_id');
    table.index('window_end');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse order of creation (respecting foreign keys)
  await knex.schema.dropTableIfExists('api_rate_limits');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('song_matches');
  await knex.schema.dropTableIfExists('conversion_jobs');
  await knex.schema.dropTableIfExists('playlists');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
}
