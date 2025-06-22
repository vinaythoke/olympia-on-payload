import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock payload
vi.mock('payload', () => ({
  default: {
    create: vi.fn(),
  },
}));

// Import after mocking
import payload from 'payload';
import { createAuditLog } from '../../src/lib/audit';

describe('Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for payload.create
    (payload.create as any).mockResolvedValue({
      doc: { id: 'audit-log-123' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create an audit log with required fields', async () => {
    await createAuditLog({
      action: 'view_details',
      entityType: 'organizer',
      entityId: 'organizer-123',
      userId: 'user-123',
      userRole: 'superadmin',
      success: true,
      ipAddress: '127.0.0.1',
    });

    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit-logs',
      data: expect.objectContaining({
        action: 'view_details',
        entityType: 'organizer',
        entityId: 'organizer-123',
        userId: 'user-123',
        userRole: 'superadmin',
        success: true,
        ipAddress: '127.0.0.1',
        timestamp: expect.any(Date),
      }),
    });
  });

  it('should include optional fields when provided', async () => {
    const details = {
      changes: {
        status: {
          from: 'active',
          to: 'suspended',
        },
      },
      reason: 'Policy violation',
    };

    await createAuditLog({
      action: 'status_change',
      entityType: 'organizer',
      entityId: 'organizer-123',
      userId: 'user-123',
      userRole: 'superadmin',
      success: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      details,
    });

    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit-logs',
      data: expect.objectContaining({
        action: 'status_change',
        entityType: 'organizer',
        entityId: 'organizer-123',
        userId: 'user-123',
        userRole: 'superadmin',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        details,
      }),
    });
  });

  it('should handle failed audit log creation gracefully', async () => {
    // Mock payload.create to throw an error
    (payload.create as any).mockRejectedValue(new Error('Database error'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await createAuditLog({
      action: 'view_details',
      entityType: 'organizer',
      entityId: 'organizer-123',
      userId: 'user-123',
      userRole: 'superadmin',
      success: true,
      ipAddress: '127.0.0.1',
    });
    
    // Should log the error but not throw
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should handle missing optional fields', async () => {
    await createAuditLog({
      action: 'view_details',
      entityType: 'organizer',
      success: true,
    });

    expect(payload.create).toHaveBeenCalledWith({
      collection: 'audit-logs',
      data: expect.objectContaining({
        action: 'view_details',
        entityType: 'organizer',
        success: true,
        timestamp: expect.any(Date),
      }),
    });
    
    // Optional fields should not be included
    const createCall = (payload.create as any).mock.calls[0][0];
    expect(createCall.data).not.toHaveProperty('entityId');
    expect(createCall.data).not.toHaveProperty('userId');
    expect(createCall.data).not.toHaveProperty('userRole');
    expect(createCall.data).not.toHaveProperty('ipAddress');
    expect(createCall.data).not.toHaveProperty('userAgent');
    expect(createCall.data).not.toHaveProperty('details');
  });

  it('should validate action types', async () => {
    // Mock console.warn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await createAuditLog({
      action: 'invalid_action' as any, // TypeScript would normally catch this
      entityType: 'organizer',
      success: true,
    });
    
    // Should warn about invalid action type
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid action type'));
    
    // But still create the log
    expect(payload.create).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should validate entity types', async () => {
    // Mock console.warn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    await createAuditLog({
      action: 'view_details',
      entityType: 'invalid_entity' as any, // TypeScript would normally catch this
      success: true,
    });
    
    // Should warn about invalid entity type
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid entity type'));
    
    // But still create the log
    expect(payload.create).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 