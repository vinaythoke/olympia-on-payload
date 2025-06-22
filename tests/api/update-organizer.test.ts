import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    findByID: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock audit logging
vi.mock('../../src/lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// Mock middleware functions
vi.mock('../../src/app/api/organizers/middleware', () => ({
  verifySuperadminAccess: vi.fn(),
  checkRateLimit: vi.fn(),
  logAccessAttempt: vi.fn(),
}));

// Import after mocking
import payload from 'payload';
import { createAuditLog } from '../../src/lib/audit';
import { 
  verifySuperadminAccess, 
  checkRateLimit, 
  logAccessAttempt
} from '../../src/app/api/organizers/middleware';
import { PATCH } from '../../src/app/api/organizers/[id]/update/route';

describe('Update Organizer API Route', () => {
  const mockParams = { id: 'organizer-123' };
  
  const mockRequest = (body: any) => {
    return {
      headers: {
        get: vi.fn((header) => {
          if (header === 'Authorization') return 'Bearer mock-token';
          if (header === 'x-forwarded-for') return '127.0.0.1';
          return null;
        }),
      },
      json: () => Promise.resolve(body),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    (checkRateLimit as any).mockReturnValue(true);
    (verifySuperadminAccess as any).mockResolvedValue({
      response: null,
      user: {
        id: 'user-123',
        role: 'superadmin',
      },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 429 if rate limit is exceeded', async () => {
    (checkRateLimit as any).mockReturnValue(false);
    
    const req = mockRequest({ organizerName: 'Updated Name' });
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(429);
    const data = await response?.json();
    expect(data).toEqual({ message: 'Too many requests. Please try again later.' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      action: 'update',
      entityType: 'organizer',
      entityId: mockParams.id,
      success: false,
      reason: 'Rate limit exceeded',
    }));
  });

  it('should return auth error response if access verification fails', async () => {
    const mockErrorResponse = {
      status: 403,
      json: () => Promise.resolve({ message: 'Access denied' }),
    };
    (verifySuperadminAccess as any).mockResolvedValue({
      response: mockErrorResponse,
      user: null,
    });
    
    const req = mockRequest({ organizerName: 'Updated Name' });
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(403);
    expect(await response?.json()).toEqual({ message: 'Access denied' });
    expect(logAccessAttempt).toHaveBeenCalled();
  });

  it('should return 400 if no update data is provided', async () => {
    const req = mockRequest({});
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(400);
    const data = await response?.json();
    expect(data).toEqual({ message: 'No update data provided' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'No update data provided',
    }));
  });

  it('should return 404 if organizer is not found', async () => {
    (payload.findByID as any).mockResolvedValue(null);
    
    const req = mockRequest({ organizerName: 'Updated Name' });
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(404);
    const data = await response?.json();
    expect(data).toEqual({ message: 'Organizer not found' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'Organizer not found',
    }));
  });

  it('should update organizer and create audit log', async () => {
    const mockOrganizer = {
      id: mockParams.id,
      organizerName: 'Original Name',
      description: 'Original description',
      contactEmail: 'original@example.com',
    };
    
    const updateData = {
      organizerName: 'Updated Name',
      description: 'Updated description',
      contactEmail: 'updated@example.com',
    };
    
    const updatedOrganizer = {
      ...mockOrganizer,
      ...updateData,
    };
    
    (payload.findByID as any).mockResolvedValue(mockOrganizer);
    (payload.update as any).mockResolvedValue(updatedOrganizer);
    
    const req = mockRequest(updateData);
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(200);
    const data = await response?.json();
    expect(data).toEqual({
      message: 'Organizer updated successfully',
      organizer: updatedOrganizer,
    });
    
    // Should call update with sanitized data
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'organizers',
      id: mockParams.id,
      data: updateData,
    });
    
    // Should create audit log
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'update',
      entityType: 'organizer',
      entityId: mockParams.id,
      details: expect.objectContaining({
        changes: expect.any(Object),
      }),
    }));
  });

  it('should sanitize sensitive fields from update data', async () => {
    const mockOrganizer = {
      id: mockParams.id,
      organizerName: 'Original Name',
    };
    
    const updateData = {
      organizerName: 'Updated Name',
      _id: 'attempt-to-change-id', // Should be filtered out
      createdAt: new Date(), // Should be filtered out
      user: 'attempt-to-change-user', // Should be filtered out
    };
    
    (payload.findByID as any).mockResolvedValue(mockOrganizer);
    (payload.update as any).mockResolvedValue({
      ...mockOrganizer,
      organizerName: updateData.organizerName,
    });
    
    const req = mockRequest(updateData);
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(200);
    
    // Should call update with sanitized data (only organizerName)
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'organizers',
      id: mockParams.id,
      data: { organizerName: updateData.organizerName },
    });
    
    // Sensitive fields should not be included in update
    expect(payload.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          _id: expect.anything(),
          createdAt: expect.anything(),
          user: expect.anything(),
        }),
      })
    );
  });

  it('should handle unexpected errors gracefully', async () => {
    (payload.findByID as any).mockRejectedValue(new Error('Database error'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const req = mockRequest({ organizerName: 'Updated Name' });
    const response = await PATCH(req, { params: mockParams });
    
    expect(response?.status).toBe(500);
    const data = await response?.json();
    expect(data.message).toContain('An error occurred');
    expect(consoleSpy).toHaveBeenCalled();
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'Server error',
    }));
    
    consoleSpy.mockRestore();
  });
}); 