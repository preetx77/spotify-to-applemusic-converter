import {
  logAuditEvent,
  logDataAccess,
  logAuthEvent,
  logConversionEvent,
  logSecurityEvent,
  formatAuditLogForStorage,
  AuditAction,
  ResourceType,
  AuditLogEntry,
} from './auditLogger';

describe('Audit Logger', () => {
  describe('logAuditEvent', () => {
    it('should create an audit log entry with required fields', () => {
      const entry = logAuditEvent(AuditAction.USER_LOGIN, ResourceType.SESSION, {
        userId: 'user-123',
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.action).toBe(AuditAction.USER_LOGIN);
      expect(entry.resourceType).toBe(ResourceType.SESSION);
      expect(entry.userId).toBe('user-123');
      expect(entry.status).toBe('success');
    });

    it('should include optional fields when provided', () => {
      const details = { method: 'OAuth', provider: 'Spotify' };
      const entry = logAuditEvent(AuditAction.USER_LOGIN, ResourceType.SESSION, {
        userId: 'user-123',
        resourceId: 'session-456',
        details,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success',
      });

      expect(entry.resourceId).toBe('session-456');
      expect(entry.details).toEqual(details);
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
    });

    it('should handle failure status with error message', () => {
      const entry = logAuditEvent(AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, ResourceType.SESSION, {
        userId: 'user-123',
        status: 'failure',
        errorMessage: 'Invalid credentials',
      });

      expect(entry.status).toBe('failure');
      expect(entry.errorMessage).toBe('Invalid credentials');
    });

    it('should include duration when provided', () => {
      const entry = logAuditEvent(AuditAction.CONVERSION_COMPLETED, ResourceType.CONVERSION_JOB, {
        userId: 'user-123',
        resourceId: 'job-789',
        durationMs: 5000,
      });

      expect(entry.durationMs).toBe(5000);
    });

    it('should generate unique IDs for each entry', () => {
      const entry1 = logAuditEvent(AuditAction.USER_LOGIN, ResourceType.SESSION, {
        userId: 'user-123',
      });
      const entry2 = logAuditEvent(AuditAction.USER_LOGIN, ResourceType.SESSION, {
        userId: 'user-123',
      });

      expect(entry1.id).not.toBe(entry2.id);
    });

    it('should generate timestamps in ISO format', () => {
      const entry = logAuditEvent(AuditAction.USER_LOGIN, ResourceType.SESSION, {
        userId: 'user-123',
      });

      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('logDataAccess', () => {
    it('should log data access with correct action', () => {
      const entry = logDataAccess(
        'user-123',
        ResourceType.PLAYLIST,
        'playlist-456',
        'read',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(entry.action).toBe(AuditAction.USER_DATA_ACCESSED);
      expect(entry.resourceType).toBe(ResourceType.PLAYLIST);
      expect(entry.userId).toBe('user-123');
      expect(entry.resourceId).toBe('playlist-456');
      expect(entry.details.accessType).toBe('read');
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
    });

    it('should support different access types', () => {
      const accessTypes: Array<'read' | 'write' | 'delete'> = ['read', 'write', 'delete'];

      accessTypes.forEach((accessType) => {
        const entry = logDataAccess(
          'user-123',
          ResourceType.PLAYLIST,
          'playlist-456',
          accessType
        );

        expect(entry.details.accessType).toBe(accessType);
      });
    });
  });

  describe('logAuthEvent', () => {
    it('should log authentication events', () => {
      const entry = logAuthEvent(
        'user-123',
        AuditAction.USER_LOGIN,
        '192.168.1.1',
        'Mozilla/5.0',
        'success'
      );

      expect(entry.action).toBe(AuditAction.USER_LOGIN);
      expect(entry.userId).toBe('user-123');
      expect(entry.status).toBe('success');
    });

    it('should log failed authentication attempts', () => {
      const entry = logAuthEvent(
        'user-123',
        AuditAction.USER_LOGIN,
        '192.168.1.1',
        'Mozilla/5.0',
        'failure',
        'Invalid password'
      );

      expect(entry.status).toBe('failure');
      expect(entry.errorMessage).toBe('Invalid password');
    });

    it('should support different auth actions', () => {
      const actions = [
        AuditAction.USER_LOGIN,
        AuditAction.USER_LOGOUT,
        AuditAction.TOKEN_REFRESH,
      ];

      actions.forEach((action) => {
        const entry = logAuthEvent('user-123', action);
        expect(entry.action).toBe(action);
      });
    });
  });

  describe('logConversionEvent', () => {
    it('should log conversion events with details', () => {
      const details = {
        playlistName: 'My Playlist',
        songCount: 50,
      };

      const entry = logConversionEvent(
        'user-123',
        'job-456',
        AuditAction.CONVERSION_STARTED,
        details,
        'success',
        undefined,
        1000
      );

      expect(entry.action).toBe(AuditAction.CONVERSION_STARTED);
      expect(entry.userId).toBe('user-123');
      expect(entry.resourceId).toBe('job-456');
      expect(entry.details).toEqual(details);
      expect(entry.durationMs).toBe(1000);
    });

    it('should log failed conversions with error message', () => {
      const entry = logConversionEvent(
        'user-123',
        'job-456',
        AuditAction.CONVERSION_FAILED,
        undefined,
        'failure',
        'API rate limit exceeded',
        5000
      );

      expect(entry.status).toBe('failure');
      expect(entry.errorMessage).toBe('API rate limit exceeded');
    });

    it('should support different conversion actions', () => {
      const actions = [
        AuditAction.CONVERSION_STARTED,
        AuditAction.CONVERSION_COMPLETED,
        AuditAction.CONVERSION_FAILED,
        AuditAction.CONVERSION_RETRIED,
      ];

      actions.forEach((action) => {
        const entry = logConversionEvent('user-123', 'job-456', action);
        expect(entry.action).toBe(action);
      });
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events', () => {
      const entry = logSecurityEvent(
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        { reason: 'Invalid token' }
      );

      expect(entry.action).toBe(AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT);
      expect(entry.status).toBe('failure');
      expect(entry.details.reason).toBe('Invalid token');
    });

    it('should support security events without user ID', () => {
      const entry = logSecurityEvent(
        AuditAction.RATE_LIMIT_EXCEEDED,
        undefined,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(entry.action).toBe(AuditAction.RATE_LIMIT_EXCEEDED);
      expect(entry.userId).toBeUndefined();
    });

    it('should support different security actions', () => {
      const actions = [
        AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
        AuditAction.RATE_LIMIT_EXCEEDED,
        AuditAction.SUSPICIOUS_ACTIVITY,
      ];

      actions.forEach((action) => {
        const entry = logSecurityEvent(action);
        expect(entry.action).toBe(action);
      });
    });
  });

  describe('formatAuditLogForStorage', () => {
    it('should format audit log entry for database storage', () => {
      const entry: AuditLogEntry = {
        id: 'audit-123',
        timestamp: '2024-01-15T10:30:45.123Z',
        userId: 'user-456',
        action: AuditAction.USER_LOGIN,
        resourceType: ResourceType.SESSION,
        resourceId: 'session-789',
        details: { method: 'OAuth' },
        ipAddress: '192.168.1.1',
        status: 'success',
      };

      const formatted = formatAuditLogForStorage(entry);

      expect(formatted.id).toBe('audit-123');
      expect(formatted.user_id).toBe('user-456');
      expect(formatted.action).toBe(AuditAction.USER_LOGIN);
      expect(formatted.resource_type).toBe(ResourceType.SESSION);
      expect(formatted.resource_id).toBe('session-789');
      expect(formatted.details).toEqual({ method: 'OAuth' });
      expect(formatted.ip_address).toBe('192.168.1.1');
      expect(formatted.created_at).toBe('2024-01-15T10:30:45.123Z');
      expect(formatted.status).toBe('success');
    });

    it('should handle optional fields in formatting', () => {
      const entry: AuditLogEntry = {
        id: 'audit-123',
        timestamp: '2024-01-15T10:30:45.123Z',
        action: AuditAction.USER_LOGIN,
        resourceType: ResourceType.SESSION,
        details: {},
        status: 'success',
      };

      const formatted = formatAuditLogForStorage(entry);

      expect(formatted.user_id).toBeUndefined();
      expect(formatted.resource_id).toBeUndefined();
      expect(formatted.ip_address).toBeUndefined();
      expect(formatted.error_message).toBeUndefined();
    });

    it('should include error message when present', () => {
      const entry: AuditLogEntry = {
        id: 'audit-123',
        timestamp: '2024-01-15T10:30:45.123Z',
        action: AuditAction.CONVERSION_FAILED,
        resourceType: ResourceType.CONVERSION_JOB,
        details: {},
        status: 'failure',
        errorMessage: 'API error',
        durationMs: 5000,
      };

      const formatted = formatAuditLogForStorage(entry);

      expect(formatted.error_message).toBe('API error');
      expect(formatted.duration_ms).toBe(5000);
    });
  });

  describe('Audit Actions enum', () => {
    it('should have all required audit actions', () => {
      expect(AuditAction.USER_LOGIN).toBeDefined();
      expect(AuditAction.USER_LOGOUT).toBeDefined();
      expect(AuditAction.TOKEN_REFRESH).toBeDefined();
      expect(AuditAction.PLAYLIST_RETRIEVED).toBeDefined();
      expect(AuditAction.CONVERSION_STARTED).toBeDefined();
      expect(AuditAction.CONVERSION_COMPLETED).toBeDefined();
      expect(AuditAction.USER_DATA_ACCESSED).toBeDefined();
      expect(AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT).toBeDefined();
    });
  });

  describe('Resource Types enum', () => {
    it('should have all required resource types', () => {
      expect(ResourceType.USER).toBeDefined();
      expect(ResourceType.SESSION).toBeDefined();
      expect(ResourceType.PLAYLIST).toBeDefined();
      expect(ResourceType.SONG).toBeDefined();
      expect(ResourceType.CONVERSION_JOB).toBeDefined();
      expect(ResourceType.AUDIT_LOG).toBeDefined();
    });
  });
});
