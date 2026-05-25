# Implementation Plan: Spotify to Apple Music Playlist Converter

## Overview

This implementation plan breaks down the feature design into discrete, incremental coding tasks using Node.js with Express for the backend. The tasks are organized to build core infrastructure first, then implement authentication flows, playlist retrieval, song matching, and finally the conversion orchestration. Each task builds on previous work with integrated testing at key checkpoints.

## Tasks

- [ ] 1. Set up project structure and core infrastructure
  - [x] 1.1 Initialize Node.js/Express project with TypeScript support
    - Create project directory structure (src/, tests/, config/)
    - Set up package.json with dependencies (express, dotenv, pg, redis, bull, axios)
    - Configure TypeScript compiler and build scripts
    - Set up ESLint and Prettier for code quality
    - _Requirements: 14.1, 15.1_

  - [ ] 1.2 Create database schema and migrations
    - Create PostgreSQL schema with all tables (users, sessions, playlists, conversion_jobs, song_matches, audit_logs, api_rate_limits)
    - Set up migration system using a tool like db-migrate or Knex.js
    - Create indexes for performance optimization
    - _Requirements: 1.1, 2.1, 12.1_

  - [x] 1.3 Set up Redis cache and session store
    - Configure Redis connection pool
    - Implement session store adapter for Express
    - Create cache utility functions for playlist and song match caching
    - _Requirements: 12.1, 14.1_

  - [ ] 1.4 Set up logging and monitoring infrastructure
    - Configure centralized logging (Winston or Pino)
    - Set up structured JSON logging format
    - Create audit logging utility for data access tracking
    - _Requirements: 15.1, 15.2_

  - [ ]* 1.5 Write unit tests for infrastructure setup
    - Test database connection and migrations
    - Test Redis connection and cache operations
    - Test logging configuration
    - _Requirements: 14.1_

- [ ] 2. Implement Spotify OAuth authentication
  - [ ] 2.1 Create Spotify OAuth service
    - Implement OAuth authorization endpoint handler
    - Implement OAuth callback handler to exchange code for tokens
    - Implement token refresh logic with automatic retry
    - Store encrypted tokens in database
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Write property test for token refresh idempotence
    - **Property 3: Token Refresh Validity**
    - **Validates: Requirements 1.6**
    - Test that refreshing a token produces a valid new token and invalidates the old one

  - [ ] 2.3 Create session management service
    - Implement session creation with unique cryptographically random session ID
    - Implement session validation middleware
    - Implement session expiration (24 hours) and inactivity timeout (30 minutes)
    - Implement session invalidation on logout
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 2.4 Write property test for session consistency
    - **Property 4: Session Consistency**
    - **Validates: Requirements 12.1, 12.3**
    - Test that session data remains consistent across concurrent requests

  - [ ]* 2.5 Write unit tests for Spotify OAuth and session management
    - Test OAuth flow with mock Spotify API
    - Test token encryption/decryption
    - Test session creation and validation
    - Test session expiration logic
    - _Requirements: 1.1, 12.1_

- [ ] 3. Implement Apple Music authentication
  - [ ] 3.1 Create Apple Music token authentication service
    - Implement token-based authentication handler
    - Store encrypted Apple Music tokens in database
    - Implement token refresh logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.2 Create unified authentication endpoint
    - Implement endpoint to check authentication status for both platforms
    - Implement endpoint to initiate Apple Music authentication
    - Return authentication state to frontend
    - _Requirements: 1.1, 2.1, 2.7_

  - [ ]* 3.3 Write unit tests for Apple Music authentication
    - Test token storage and retrieval
    - Test token refresh logic
    - Test authentication status endpoint
    - _Requirements: 2.1_

- [ ] 4. Implement Spotify playlist retrieval
  - [ ] 4.1 Create Spotify playlist service
    - Implement endpoint to fetch user's playlists from Spotify API
    - Implement pagination handling for playlists (max 50 per request)
    - Implement caching with 5-minute TTL
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [ ] 4.2 Create playlist metadata retrieval
    - Implement endpoint to fetch all songs from a specific playlist
    - Implement pagination handling for songs (max 100 per request)
    - Store playlist metadata (name, description, image, visibility)
    - _Requirements: 3.1, 3.6, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 4.3 Write unit tests for playlist retrieval
    - Test playlist fetching with mock Spotify API
    - Test pagination logic
    - Test caching behavior
    - Test error handling for API failures
    - _Requirements: 3.1, 3.4_

- [ ] 5. Implement song matching engine
  - [ ] 5.1 Create song matching algorithm
    - Implement metadata normalization (lowercase, remove special characters)
    - Implement Levenshtein distance calculation for similarity scoring
    - Implement similarity score calculation (0.4 title + 0.4 artist + 0.2 album)
    - Implement confidence threshold logic (≥0.95 matched, 0.85-0.94 ambiguous, <0.85 unmatched)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.2 Create Apple Music search integration
    - Implement Apple Music API search endpoint integration
    - Implement batch processing of songs (10 songs per batch)
    - Implement early termination for high-confidence matches (>0.98)
    - _Requirements: 5.1, 5.5_

  - [ ] 5.3 Create song match caching layer
    - Implement 30-day cache for song matches
    - Implement cache lookup before API calls
    - Implement cache invalidation logic
    - _Requirements: 5.1_

  - [ ]* 5.4 Write property test for song matching idempotence
    - **Property 1: Song Matching Idempotence**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Test that matching the same song multiple times produces identical results

  - [ ]* 5.5 Write unit tests for song matching engine
    - Test similarity score calculation
    - Test confidence threshold logic
    - Test batch processing
    - Test cache operations
    - Test edge cases (special characters, accents, alternate spellings)
    - _Requirements: 5.1, 5.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement conversion job orchestration
  - [ ] 7.1 Create conversion job state machine
    - Implement job status transitions (pending → validating → retrieving_songs → matching → creating_playlist → adding_songs → completed)
    - Implement error state and retry logic
    - Store job state in database
    - _Requirements: 6.1, 6.2, 6.7, 11.1, 11.2_

  - [ ] 7.2 Create conversion job processor
    - Implement validation step (verify tokens, playlist exists)
    - Implement song retrieval step (fetch all songs from Spotify)
    - Implement matching step (call song matching engine)
    - Implement playlist creation step (create playlist in Apple Music)
    - Implement song addition step (add matched songs to Apple Music)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 7.3 Implement exponential backoff retry mechanism
    - Implement retry logic with exponential backoff (2^retry_count seconds, max 30 seconds)
    - Implement transient vs permanent error classification
    - Implement automatic token refresh on 401 errors
    - _Requirements: 11.1, 11.2_

  - [ ]* 7.4 Write property test for conversion job atomicity
    - **Property 5: Conversion Job Atomicity**
    - **Validates: Requirements 6.3, 6.4, 6.5**
    - Test that conversions either complete fully or fail without partial state

  - [ ]* 7.5 Write unit tests for conversion job orchestration
    - Test state machine transitions
    - Test validation logic
    - Test retry mechanism
    - Test error handling
    - _Requirements: 6.1, 6.7, 11.1_

- [ ] 8. Implement playlist creation and song addition
  - [ ] 8.1 Create Apple Music playlist creation service
    - Implement playlist creation with name, description, visibility
    - Implement duplicate playlist detection
    - Implement playlist name suffix handling for duplicates
    - _Requirements: 6.3, 10.1, 10.2, 10.3, 10.5, 17.1, 17.2, 17.3, 17.4_

  - [ ] 8.2 Create Apple Music song addition service
    - Implement batch song addition to playlist
    - Implement song order preservation
    - Implement error handling for individual song failures
    - _Requirements: 6.4, 6.5_

  - [ ]* 8.3 Write unit tests for playlist creation and song addition
    - Test playlist creation with mock Apple Music API
    - Test duplicate detection
    - Test song addition
    - Test error handling
    - _Requirements: 6.3, 6.4_

- [ ] 9. Implement conversion progress tracking
  - [ ] 9.1 Create WebSocket server for real-time updates
    - Set up WebSocket connection handling
    - Implement progress update broadcasting
    - Implement connection management and cleanup
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 9.2 Create conversion progress tracking service
    - Implement progress calculation (percentage, current song, time remaining)
    - Implement progress update emission to WebSocket clients
    - Implement progress persistence for background conversions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 9.3 Write unit tests for progress tracking
    - Test progress calculation accuracy
    - Test WebSocket message broadcasting
    - Test background job tracking
    - _Requirements: 7.1, 7.2_

- [ ] 10. Implement conversion results and reporting
  - [ ] 10.1 Create conversion results service
    - Implement results page data generation
    - Implement conversion statistics calculation (matched, unmatched, ambiguous counts)
    - Implement Apple Music playlist link generation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 10.2 Create report generation service
    - Implement CSV report generation for unmatched songs
    - Implement JSON report generation
    - Implement report download endpoint
    - _Requirements: 8.6, 8.7, 9.1, 9.2, 9.3_

  - [ ]* 10.3 Write unit tests for results and reporting
    - Test results calculation
    - Test report generation
    - Test download functionality
    - _Requirements: 8.1, 8.6_

- [ ] 11. Implement unmatched songs handling
  - [ ] 11.1 Create unmatched songs service
    - Implement unmatched songs list retrieval
    - Implement manual song search interface
    - Implement manual song selection and addition
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 11.2 Write unit tests for unmatched songs handling
    - Test unmatched songs retrieval
    - Test manual search
    - Test manual song addition
    - _Requirements: 9.1, 9.4_

- [ ] 12. Implement conversion history and tracking
  - [ ] 12.1 Create conversion history service
    - Implement conversion history storage
    - Implement conversion history retrieval with pagination
    - Implement conversion details retrieval
    - Implement conversion retry functionality
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

  - [ ]* 12.2 Write unit tests for conversion history
    - Test history storage and retrieval
    - Test pagination
    - Test retry functionality
    - _Requirements: 18.1, 18.2_

- [ ] 13. Implement rate limiting and quota management
  - [ ] 13.1 Create rate limiting middleware
    - Implement token bucket rate limiter
    - Implement per-user rate limiting
    - Implement API provider rate limit tracking
    - Implement rate limit queue for requests exceeding limits
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 13.2 Write unit tests for rate limiting
    - Test rate limit enforcement
    - Test queue processing
    - Test rate limit reset
    - _Requirements: 19.1, 19.3_

- [ ] 14. Implement notification system
  - [ ] 14.1 Create notification service
    - Implement in-app notification generation
    - Implement email notification sending
    - Implement notification preferences storage
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ]* 14.2 Write unit tests for notification system
    - Test notification generation
    - Test email sending
    - Test preference handling
    - _Requirements: 20.1, 20.3_

- [ ] 15. Implement data privacy and security
  - [ ] 15.1 Create token encryption/decryption utilities
    - Implement AES-256-GCM encryption for tokens
    - Implement secure key management
    - Implement key rotation logic
    - _Requirements: 13.2, 12.1_

  - [ ] 15.2 Create audit logging service
    - Implement audit log recording for all data access
    - Implement audit log retrieval for compliance
    - Implement data deletion tracking
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

  - [ ] 15.3 Create data deletion service
    - Implement soft delete (mark deleted_at timestamp)
    - Implement hard delete after 30 days
    - Implement data deletion request handling
    - _Requirements: 13.3, 13.4_

  - [ ]* 15.4 Write unit tests for security and privacy
    - Test token encryption/decryption
    - Test audit logging
    - Test data deletion
    - _Requirements: 13.2, 13.3_

- [ ] 16. Implement error handling and recovery
  - [ ] 16.1 Create error handling middleware
    - Implement global error handler
    - Implement error classification (transient vs permanent)
    - Implement user-friendly error messages
    - _Requirements: 11.3, 11.4, 11.5, 11.6_

  - [ ] 16.2 Create API error response standardization
    - Implement consistent error response format
    - Implement error logging with context
    - Implement error tracking and alerting
    - _Requirements: 11.3, 15.2_

  - [ ]* 16.3 Write unit tests for error handling
    - Test error classification
    - Test error message generation
    - Test error logging
    - _Requirements: 11.3, 11.4_

- [ ] 17. Implement API endpoints and routing
  - [ ] 17.1 Create authentication endpoints
    - POST /auth/spotify - Initiate Spotify OAuth
    - GET /auth/spotify/callback - Handle Spotify OAuth callback
    - POST /auth/apple-music - Initiate Apple Music authentication
    - GET /auth/status - Get authentication status
    - POST /auth/logout - Logout user
    - _Requirements: 1.1, 2.1, 2.7_

  - [ ] 17.2 Create playlist endpoints
    - GET /playlists - List user's Spotify playlists
    - GET /playlists/:id/songs - Get songs from a playlist
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 17.3 Create conversion endpoints
    - POST /conversions - Start a new conversion
    - GET /conversions - List conversion history
    - GET /conversions/:id - Get conversion details
    - GET /conversions/:id/progress - Get conversion progress
    - POST /conversions/:id/retry - Retry a failed conversion
    - _Requirements: 6.1, 7.1, 18.1, 18.2_

  - [ ] 17.4 Create results endpoints
    - GET /conversions/:id/results - Get conversion results
    - GET /conversions/:id/unmatched - Get unmatched songs
    - POST /conversions/:id/unmatched/:songId - Manually add unmatched song
    - GET /conversions/:id/report - Download conversion report
    - _Requirements: 8.1, 8.6, 9.1, 9.4_

  - [ ]* 17.5 Write integration tests for all endpoints
    - Test authentication flow
    - Test playlist retrieval
    - Test conversion workflow
    - Test error handling
    - _Requirements: 1.1, 6.1, 14.1_

- [ ] 18. Implement monitoring and health checks
  - [ ] 18.1 Create health check endpoints
    - GET /health/live - Liveness probe
    - GET /health/ready - Readiness probe (checks DB, Redis, external APIs)
    - _Requirements: 15.1, 15.2_

  - [ ] 18.2 Create metrics collection
    - Implement conversion metrics (started, completed, failed)
    - Implement API metrics (request count, response time, error rate)
    - Implement system metrics (CPU, memory, database connections)
    - _Requirements: 15.1, 15.3, 15.4_

  - [ ]* 18.3 Write unit tests for monitoring
    - Test health check endpoints
    - Test metrics collection
    - _Requirements: 15.1_

- [ ] 19. Checkpoint - Ensure all tests pass and integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Create frontend integration layer
  - [ ] 20.1 Create API client utilities
    - Implement HTTP client with error handling
    - Implement WebSocket client for real-time updates
    - Implement request/response interceptors
    - _Requirements: 7.1, 7.2_

  - [ ] 20.2 Create authentication UI components
    - Implement Spotify connect button
    - Implement Apple Music connect button
    - Implement authentication status display
    - _Requirements: 1.1, 2.1, 2.7_

  - [ ] 20.3 Create playlist selection UI
    - Implement playlist list display
    - Implement playlist selection checkboxes
    - Implement select/deselect all functionality
    - Implement estimated conversion time display
    - _Requirements: 3.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ] 20.4 Create conversion progress UI
    - Implement progress bar display
    - Implement current song display
    - Implement estimated time remaining display
    - Implement real-time progress updates via WebSocket
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ] 20.5 Create conversion results UI
    - Implement results summary display
    - Implement unmatched songs list
    - Implement manual song search and addition
    - Implement report download
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3_

  - [ ] 20.6 Create conversion history UI
    - Implement conversion history list
    - Implement conversion details view
    - Implement retry functionality
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 20.7 Write component tests for UI
    - Test component rendering
    - Test user interactions
    - Test data binding
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

- [ ] 21. Final checkpoint - Ensure all tests pass and system is ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP, but are recommended for production quality
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and early error detection
- Property tests validate universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- The implementation uses Node.js with Express for the backend as selected
- Frontend implementation uses React or Vue.js (to be determined during frontend setup)
- All code should follow security best practices (input validation, parameterized queries, secure token handling)
- Database queries should use parameterized statements to prevent SQL injection
- All external API calls should include timeout handling and retry logic

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["1.5", "2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 3, "tasks": ["2.4", "2.5", "3.3"] },
    { "id": 4, "tasks": ["4.1", "4.2"] },
    { "id": 5, "tasks": ["4.3", "5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3", "5.4", "5.5"] },
    { "id": 7, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4", "7.5", "8.1", "8.2"] },
    { "id": 9, "tasks": ["8.3", "9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3", "10.1", "10.2"] },
    { "id": 11, "tasks": ["10.3", "11.1", "12.1"] },
    { "id": 12, "tasks": ["11.2", "12.2", "13.1"] },
    { "id": 13, "tasks": ["13.2", "14.1", "15.1"] },
    { "id": 14, "tasks": ["14.2", "15.2", "15.3"] },
    { "id": 15, "tasks": ["15.4", "16.1", "16.2"] },
    { "id": 16, "tasks": ["16.3", "17.1", "17.2"] },
    { "id": 17, "tasks": ["17.3", "17.4", "18.1"] },
    { "id": 18, "tasks": ["17.5", "18.2", "18.3"] },
    { "id": 19, "tasks": ["20.1", "20.2", "20.3"] },
    { "id": 20, "tasks": ["20.4", "20.5", "20.6"] },
    { "id": 21, "tasks": ["20.7"] }
  ]
}
```
