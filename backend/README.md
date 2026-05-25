# Spotify to Apple Music Converter - Backend

Backend service for the Spotify to Apple Music Playlist Converter application.

## Project Structure

```
src/
├── config/          # Configuration files (logger, database, etc.)
├── middleware/      # Express middleware (logging, auth, etc.)
├── utils/           # Utility functions (audit logger, metrics, etc.)
├── services/        # Business logic services
├── routes/          # API route handlers
├── models/          # Data models and types
└── index.ts         # Application entry point

tests/              # Test files
dist/               # Compiled JavaScript output
logs/               # Application logs
```

## Setup

### Prerequisites

- Node.js 16+ 
- npm or yarn
- PostgreSQL 12+
- Redis 6+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

### Development

Start the development server:
```bash
npm run dev
```

### Build

Build the TypeScript code:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Code Quality

### Linting

Check for linting errors:
```bash
npm run lint
```

Fix linting errors:
```bash
npm run lint:fix
```

### Formatting

Format code with Prettier:
```bash
npm run format
```

## Logging

The application uses Winston for centralized logging with structured JSON format.

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages (development only)

### Log Output

Logs are written to:
- Console (development)
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### Structured Logging

All logs include:
- Timestamp (ISO 8601 format)
- Log level
- Service name
- Environment
- Custom context (user ID, trace ID, etc.)

Example log entry:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "service": "spotify-to-applemusic-converter",
  "environment": "development",
  "message": "Conversion completed",
  "userId": "user-123",
  "conversionJobId": "job-456",
  "durationMs": 5000,
  "songsMatched": 50,
  "songsUnmatched": 5
}
```

## Audit Logging

The application tracks all sensitive operations through audit logging.

### Audit Actions

- `USER_LOGIN` - User authentication
- `USER_LOGOUT` - User logout
- `TOKEN_REFRESH` - Token refresh
- `PLAYLIST_RETRIEVED` - Playlist access
- `CONVERSION_STARTED` - Conversion initiated
- `CONVERSION_COMPLETED` - Conversion finished
- `USER_DATA_ACCESSED` - Data access
- `UNAUTHORIZED_ACCESS_ATTEMPT` - Security event

### Audit Log Entry

```json
{
  "id": "audit-123",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "userId": "user-123",
  "action": "CONVERSION_COMPLETED",
  "resourceType": "CONVERSION_JOB",
  "resourceId": "job-456",
  "details": {
    "songsMatched": 50,
    "songsUnmatched": 5
  },
  "ipAddress": "192.168.1.1",
  "status": "success",
  "durationMs": 5000
}
```

## Metrics

The application collects metrics for monitoring and performance analysis.

### Conversion Metrics

- Total conversions started/completed/failed
- Average conversion time
- Total songs matched/unmatched
- Matching accuracy percentage

### API Metrics

- Request count
- Error count and rate
- Average response time
- p95 and p99 response times

### System Metrics

- CPU usage
- Memory usage
- Database connection pool utilization
- Redis memory usage
- Queue depth

## API Endpoints

### Health Checks

- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

### Authentication

- `POST /auth/spotify` - Initiate Spotify OAuth
- `GET /auth/spotify/callback` - Spotify OAuth callback
- `POST /auth/apple-music` - Initiate Apple Music authentication
- `GET /auth/status` - Get authentication status
- `POST /auth/logout` - Logout user

### Playlists

- `GET /playlists` - List user's Spotify playlists
- `GET /playlists/:id/songs` - Get songs from a playlist

### Conversions

- `POST /conversions` - Start a new conversion
- `GET /conversions` - List conversion history
- `GET /conversions/:id` - Get conversion details
- `GET /conversions/:id/progress` - Get conversion progress
- `POST /conversions/:id/retry` - Retry a failed conversion

### Results

- `GET /conversions/:id/results` - Get conversion results
- `GET /conversions/:id/unmatched` - Get unmatched songs
- `POST /conversions/:id/unmatched/:songId` - Manually add unmatched song
- `GET /conversions/:id/report` - Download conversion report

## Error Handling

The application implements comprehensive error handling:

- Transient errors (network timeouts, rate limits) are automatically retried with exponential backoff
- Permanent errors (invalid credentials, not found) are logged and reported to the user
- All errors include context (user ID, operation, timestamp) for debugging

## Security

- All tokens are encrypted at rest using AES-256-GCM
- All communications use HTTPS/TLS
- Session IDs are cryptographically random (32+ bytes)
- Rate limiting prevents abuse
- Audit logging tracks all sensitive operations
- Input validation prevents injection attacks

## Performance

- Song matching: ≥ 10 songs/second
- API response times: < 500ms (p95)
- Conversion of 100-song playlist: < 60 seconds
- Support for 100+ concurrent users

## Monitoring

The application exposes metrics and logs for monitoring:

- Structured JSON logs for centralized logging systems
- Audit logs for compliance and security
- Performance metrics for alerting
- Health check endpoints for orchestration

## Contributing

1. Follow the code style (ESLint + Prettier)
2. Write tests for new features
3. Ensure all tests pass before submitting PR
4. Update documentation as needed

## License

MIT
