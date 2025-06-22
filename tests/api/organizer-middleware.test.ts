import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    verifyToken: vi.fn(),
  },
}));

// Mock auth utilities
vi.mock('../../src/lib/auth', () => ({
  getToken: vi.fn(),
  getUser: vi.fn(),
  hasRole: vi.fn(),
}));

// Mock audit logging
vi.mock('../../src/lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// Import after mocking
import payload from 'payload';
import { getToken, getUser, hasRole } from '../../src/lib/auth';
import { createAuditLog } from '../../src/lib/audit';
import { 
  verifySuperadminAccess,
  verifyOrganizerAccess,
  checkRateLimit,
  logAccessAttempt,
  validateOrganizerStatus
} from '../../src/app/api/organizers/middleware';

describe('Organizer Middleware Functions', () => {
  const mockRequest = () => {
    return {
      headers: {
        get: vi.fn((header) => {
          if (header === 'Authorization') return 'Bearer mock-token';
          if (header === 'x-forwarded-for') return '127.0.0.1';
          return null;
        }),
      },
      cookies: {
        get: vi.fn((name) => {
          if (name === 'payload-token') return { value: 'cookie-token' };
          return null;
        }),
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    (getToken as any).mockReturnValue('mock-token');
    (getUser as any).mockResolvedValue({
      id: 'user-123',
      email: 'admin@example.com',
      role: 'superadmin',
    });
    (hasRole as any).mockReturnValue(true);
    (payload.verifyToken as any).mockResolvedValue({
      id: 'user-123',
      email: 'admin@example.com',
      role: 'superadmin',
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('verifySuperadminAccess', () => {
    it('should return unauthorized response if no token is found', async () => {
      (getToken as any).mockReturnValue(null);
      
      const req = mockRequest();
      const result = await verifySuperadminAccess(req);
      
      expect(result.response?.status).toBe(401);
      expect(await result.response?.json()).toEqual({ message: 'Unauthorized' });
      expect(result.user).toBeNull();
    });

    it('should return forbidden response if user is not a superadmin', async () => {
      (hasRole as any).mockReturnValue(false);
      
      const req = mockRequest();
      const result = await verifySuperadminAccess(req);
      
      expect(result.response?.status).toBe(403);
      expect(await result.response?.json()).toEqual({ message: 'Forbidden: Only superadmins can perform this action' });
      expect(result.user).toBeNull();
    });

    it('should return user data if superadmin access is verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'superadmin',
      };
      (getUser as any).mockResolvedValue(mockUser);
      
      const req = mockRequest();
      const result = await verifySuperadminAccess(req);
      
      expect(result.response).toBeNull();
      expect(result.user).toEqual(mockUser);
    });

    it('should handle unexpected errors gracefully', async () => {
      (getUser as any).mockRejectedValue(new Error('Authentication error'));
      
      // Mock console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const req = mockRequest();
      const result = await verifySuperadminAccess(req);
      
      expect(result.response?.status).toBe(500);
      expect(await result.response?.json()).toEqual({ message: 'Server error during authentication' });
      expect(result.user).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('verifyOrganizerAccess', () => {
    it('should return unauthorized response if no token is found', async () => {
      (getToken as any).mockReturnValue(null);
      
      const req = mockRequest();
      const result = await verifyOrganizerAccess(req);
      
      expect(result.response?.status).toBe(401);
      expect(await result.response?.json()).toEqual({ message: 'Unauthorized' });
      expect(result.user).toBeNull();
    });

    it('should return user data if access is verified', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        role: 'superadmin',
      };
      (getUser as any).mockResolvedValue(mockUser);
      
      const req = mockRequest();
      const result = await verifyOrganizerAccess(req);
      
      expect(result.response).toBeNull();
      expect(result.user).toEqual(mockUser);
    });
  });

  describe('checkRateLimit', () => {
    it('should return true when rate limit is not exceeded', () => {
      const req = mockRequest();
      const result = checkRateLimit(req, 'view_details');
      
      expect(result).toBe(true);
    });

    // Note: A more comprehensive test would include testing rate limiting logic,
    // but that would require mocking the rate limiter implementation or time
  });

  describe('logAccessAttempt', () => {
    it('should create an audit log with the provided details', () => {
      const req = mockRequest();
      const user = { id: 'user-123', role: 'superadmin' };
      
      logAccessAttempt({
        req,
        user,
        action: 'view_details',
        entityType: 'organizer',
        entityId: 'organizer-123',
        success: true,
      });
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'view_details',
        entityType: 'organizer',
        entityId: 'organizer-123',
        userId: user.id,
        userRole: user.role,
        success: true,
        ipAddress: '127.0.0.1',
      }));
    });

    it('should handle failed access attempts with reason', () => {
      const req = mockRequest();
      
      logAccessAttempt({
        req,
        user: null,
        action: 'update_status',
        entityType: 'organizer',
        entityId: 'organizer-123',
        success: false,
        reason: 'Unauthorized access',
      });
      
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'update_status',
        entityType: 'organizer',
        entityId: 'organizer-123',
        userId: null,
        userRole: null,
        success: false,
        details: expect.objectContaining({
          reason: 'Unauthorized access',
        }),
        ipAddress: '127.0.0.1',
      }));
    });
  });

  describe('validateOrganizerStatus', () => {
    it('should return valid for correct status values', () => {
      const result = validateOrganizerStatus('active');
      
      expect(result.isValid).toBe(true);
      expect(result.errorResponse).toBeNull();
    });

    it('should return invalid with error response for incorrect status values', () => {
      const result = validateOrganizerStatus('invalid-status');
      
      expect(result.isValid).toBe(false);
      expect(result.errorResponse?.status).toBe(400);
      expect(result.errorResponse?.json()).resolves.toEqual({
        message: 'Invalid status value. Must be one of: active, inactive, suspended',
      });
    });

    it('should return invalid for empty status', () => {
      const result = validateOrganizerStatus('');
      
      expect(result.isValid).toBe(false);
      expect(result.errorResponse?.status).toBe(400);
    });
  });
}); 