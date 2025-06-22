import { Payload } from 'payload'
import { NextRequest } from 'next/server'

export type AuditAction = 'create' | 'update' | 'delete' | 'status_change' | 'access_attempt'
export type EntityType = 'organizer' | 'user' | 'event' | 'volunteer' | 'system'

/**
 * Creates an audit log entry for tracking changes to sensitive data
 */
export async function createAuditLog({
  payload,
  action,
  entityType,
  entityId,
  details,
  userId,
  req,
}: {
  payload: Payload
  action: AuditAction
  entityType: EntityType
  entityId: string
  details?: Record<string, any>
  userId: string
  req?: NextRequest
}) {
  try {
    // Extract IP address and user agent from request if available
    const ipAddress = req?.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = req?.headers.get('user-agent') || 'unknown'

    // Create the audit log entry directly through the local API
    await payload.create({
      collection: 'audit-logs' as any, // Type assertion as a workaround for the type error
      data: {
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent,
        createdBy: userId,
      } as any, // Type assertion as a workaround for the type error
    })
  } catch (error) {
    // Log the error but don't throw - audit logging should not block operations
    console.error('Failed to create audit log:', error)
  }
} 