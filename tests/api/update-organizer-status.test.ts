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
  validateOrganizerStatus: vi.fn(),
}));

// Import after mocking
import payload from 'payload';
import { createAuditLog } from '../../src/lib/audit';
import { 
  verifySuperadminAccess, 
  checkRateLimit, 
  logAccessAttempt,
  validateOrganizerStatus
} from '../../src/app/api/organizers/middleware';
import { PATCH } from '../../src/app/api/organizers/[id]/status/route';

describe('Update Organizer Status API Route', () => {
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
    (validateOrganizerStatus as any).mockReturnValue({ isValid: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 429 if rate limit is exceeded', async () => {
    (checkRateLimit as any).mockReturnValue(false);
    
    const req = mockRequest({ status: 'inactive' });
    const response = await PATCH(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toEqual({ message: 'Too many requests. Please try again later.' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      action: 'update_status',
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
    
    const req = mockRequest({ status: 'inactive' });
    const response = await PATCH(req, { params: mockParams });
    
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    expect(logAccessAttempt).toHaveBeenCalled();
  });

  it('should return 400 if status validation fails', async () => {
    const mockErrorResponse = {
      status: 400,
      json: () => Promise.resolve({ message: 'Invalid status value' }),
    };
    (validateOrganizerStatus as any).mockReturnValue({ 
      isValid: false,
      errorResponse: mockErrorResponse
    });
    
    const req = mockRequest({ status: 'invalid-status' });
    const response = await PATCH(req, { params: mockParams });
    
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: 'Invalid status value' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'Invalid status value',
    }));
  });

  it('should return 404 if organizer is not found', async () => {
    (payload.findByID as any).mockResolvedValue(null);
    
    const req = mockRequest({ status: 'inactive' });
    const response = await PATCH(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ message: 'Organizer not found' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'Organizer not found',
    }));
  });

  it('should return 200 with no change message if status is already set', async () => {
    const currentStatus = 'active';
    
    (payload.findByID as any).mockResolvedValue({
      id: mockParams.id,
      organizerName: 'Test Organizer',
      status: currentStatus,
    });
    
    const req = mockRequest({ status: currentStatus }); // Same status
    const response = await PATCH(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      message: 'No change in status',
      organizer: expect.objectContaining({
        id: mockParams.id,
        organizerName: 'Test Organizer',
        status: currentStatus,
      }),
    });
    
    // Should not call update or create audit log
    expect(payload.update).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it('should update status and create audit log when status changes', async () => {
    const currentStatus = 'active';
    const newStatus = 'inactive';
    
    const mockOrganizer = {
      id: mockParams.id,
      organizerName: 'Test Organizer',
      status: currentStatus,
    };
    
    const updatedOrganizer = {
      ...mockOrganizer,
      status: newStatus,
    };
    
    (payload.findByID as any).mockResolvedValue(mockOrganizer);
    (payload.update as any).mockResolvedValue(updatedOrganizer);
    
    const req = mockRequest({ status: newStatus });
    const response = await PATCH(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      message: 'Organizer status updated successfully',
      organizer: expect.objectContaining({
        id: mockParams.id,
        organizerName: 'Test Organizer',
        status: newStatus,
      }),
    });
    
    // Should call update
    expect(payload.update).toHaveBeenCalledWith({
      collection: 'organizers',
      id: mockParams.id,
      data: { status: newStatus },
    });
    
    // Should create audit log
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'status_change',
      entityType: 'organizer',
      entityId: mockParams.id,
      details: expect.objectContaining({
        previousStatus: currentStatus,
        newStatus: newStatus,
      }),
    }));
  });

  it('should handle unexpected errors gracefully', async () => {
    (payload.findByID as any).mockRejectedValue(new Error('Database error'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const req = mockRequest({ status: 'inactive' });
    const response = await PATCH(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain('An error occurred');
    expect(consoleSpy).toHaveBeenCalled();
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'Server error',
    }));
    
    consoleSpy.mockRestore();
  });
}); 