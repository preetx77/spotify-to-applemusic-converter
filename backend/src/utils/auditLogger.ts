import logger from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit logging utility for tracking data access and sensitive operations
 * Implements comprehensive audit trail for compliance and security monitoring
 */

export enum AuditAction {
  // Authentication actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Data access actions
  PLAYLIST_RETRIEVED = 'PLAYLIST_RETRIEVED',
  PLAYLIST_CREATED = 'PLAYLIST_CREATED',
  PLAYLIST_UPDATED = 'PLAYLIST_UPDATED',
  PLAYLIST_DELETED = 'PLAYLIST_DELETED',
  SONG_MATCHED = 'SONG_MATCHED',
  SONG_ADDED = 'SONG_ADDED',

  // Conversion actions
  CONVERSION_STARTED = 'CONVERSION_STARTED',
  CONVERSION_COMPLETED = 'CONVERSION_COMPLETED',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  CONVERSION_RETRIED = 'CONVERSION_RETRIED',

  // User data actions
  USER_DATA_ACCESSED = 'USER_DATA_ACCESSED',
  USER_DATA_MODIFIED = 'USER_DATA_MODIFIED',
  USER_DATA_DELETED = 'USER_DATA_DELETED',
  USER_DATA_EXPORTED = 'USER_DATA_EXPORTED',

  // Security actions
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export enum ResourceType {
  USER = 'USER',
  SESSION = 'SESSION',
  PLAYLIST = 'PLAYLIST',
  SONG = 'SONG',
  CONVERSION_JOB = 'CONVERSION_JOB',
  SONG_MATCH = 'SONG_MATCH',
  AUDIT_LOG = 'AUDIT_LOG',
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  durationMs?: number;
}

/**
 * Log an audit event
 * @param action - The action being performed
 * @param resourceType - The type of resource being accessed
 * @param options - Additional options for the audit log
 */
export function logAuditEvent(
  action: AuditAction,
  resourceType: ResourceType,
  options: {
    userId?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    status?: 'success' | 'failure';
    errorMessage?: string;
    durationMs?: number;
  } = {}
): AuditLogEntry {
  const auditEntry: AuditLogEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId: options.userId,
    action,
    resourceType,
    resourceId: options.resourceId,
    details: options.details || {},
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
    status: options.status || 'success',
    errorMessage: options.errorMessage,
    durationMs: options.durationMs,
  };

  // Log at appropriate level based on status
  const logLevel = options.status === 'failure' ? 'warn' : 'info';
  logger.log(logLevel, `Audit: ${action}`, {
    auditId: auditEntry.id,
    action,
    resourceType,
    resourceId: options.resourceId,
    userId: options.userId,
    status: options.status || 'success',
    durationMs: options.durationMs,
    details: options.details,
  });

  return auditEntry;
}

/**
 * Log data access for compliance tracking
 * @param userId - User ID accessing the data
 * @param resourceType - Type of resource being accessed
 * @param resourceId - ID of the resource being accessed
 * @param accessType - Type of access (read, write, delete)
 * @param ipAddress - IP address of the requester
 * @param userAgent - User agent of the requester
 */
export function logDataAccess(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  accessType: 'read' | 'write' | 'delete',
  ipAddress?: string,
  userAgent?: string
): AuditLogEntry {
  return logAuditEvent(AuditAction.USER_DATA_ACCESSED, resourceType, {
    userId,
    resourceId,
    details: { accessType },
    ipAddress,
    userAgent,
    status: 'success',
  });
}

/**
 * Log authentication event
 * @param userId - User ID
 * @param action - Authentication action (login, logout, token refresh)
 * @param ipAddress - IP address of the requester
 * @param userAgent - User agent of the requester
 * @param status - Success or failure
 * @param errorMessage - Error message if failed
 */
export function logAuthEvent(
  userId: string,
  action: AuditAction,
  ipAddress?: string,
  userAgent?: string,
  status: 'success' | 'failure' = 'success',
  errorMessage?: string
): AuditLogEntry {
  return logAuditEvent(action, ResourceType.SESSION, {
    userId,
    ipAddress,
    userAgent,
    status,
    errorMessage,
  });
}

/**
 * Log conversion event
 * @param userId - User ID
 * @param conversionJobId - Conversion job ID
 * @param action - Conversion action
 * @param details - Additional details about the conversion
 * @param status - Success or failure
 * @param errorMessage - Error message if failed
 * @param durationMs - Duration of the conversion in milliseconds
 */
export function logConversionEvent(
  userId: string,
  conversionJobId: string,
  action: AuditAction,
  details?: Record<string, any>,
  status: 'success' | 'failure' = 'success',
  errorMessage?: string,
  durationMs?: number
): AuditLogEntry {
  return logAuditEvent(action, ResourceType.CONVERSION_JOB, {
    userId,
    resourceId: conversionJobId,
    details,
    status,
    errorMessage,
    durationMs,
  });
}

/**
 * Log security event (unauthorized access, rate limit exceeded, etc.)
 * @param action - Security action
 * @param userId - User ID (if known)
 * @param ipAddress - IP address of the requester
 * @param userAgent - User agent of the requester
 * @param details - Additional details about the security event
 */
export function logSecurityEvent(
  action: AuditAction,
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  details?: Record<string, any>
): AuditLogEntry {
  return logAuditEvent(action, ResourceType.SESSION, {
    userId,
    ipAddress,
    userAgent,
    details,
    status: 'failure',
  });
}

/**
 * Create a structured audit log entry for database storage
 * This format is designed to be stored in the audit_logs table
 * @param entry - Audit log entry
 * @returns Formatted entry for database storage
 */
export function formatAuditLogForStorage(entry: AuditLogEntry): Record<string, any> {
  return {
    id: entry.id,
    user_id: entry.userId,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    details: entry.details,
    ip_address: entry.ipAddress,
    created_at: entry.timestamp,
    status: entry.status,
    error_message: entry.errorMessage,
    duration_ms: entry.durationMs,
  };
}
