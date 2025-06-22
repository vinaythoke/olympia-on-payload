import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    findByID: vi.fn(),
    verifyToken: vi.fn(),
  },
}));

// Mock audit logging
vi.mock('../../src/lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// Mock middleware functions
vi.mock('../../src/app/api/organizers/middleware', () => ({
  verifyOrganizerAccess: vi.fn(),
  checkRateLimit: vi.fn(),
  logAccessAttempt: vi.fn(),
}));

// Import after mocking
import payload from 'payload';
import { createAuditLog } from '../../src/lib/audit';
import { 
  verifyOrganizerAccess, 
  checkRateLimit, 
  logAccessAttempt 
} from '../../src/app/api/organizers/middleware';
import { GET } from '../../src/app/api/organizers/[id]/route';

describe('Get Organizer Details API Route', () => {
  const mockParams = { id: 'organizer-123' };
  
  const mockRequest = () => {
    return {
      headers: {
        get: vi.fn((header) => {
          if (header === 'Authorization') return 'Bearer mock-token';
          if (header === 'x-forwarded-for') return '127.0.0.1';
          return null;
        }),
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    (checkRateLimit as any).mockReturnValue(true);
    (verifyOrganizerAccess as any).mockResolvedValue({
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
    
    const req = mockRequest();
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toEqual({ message: 'Too many requests. Please try again later.' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      action: 'view_details',
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
    (verifyOrganizerAccess as any).mockResolvedValue({
      response: mockErrorResponse,
      user: null,
    });
    
    const req = mockRequest();
    const response = await GET(req, { params: mockParams });
    
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: 'Access denied' });
    expect(logAccessAttempt).toHaveBeenCalled();
  });

  it('should return 404 if organizer is not found', async () => {
    (payload.findByID as any).mockResolvedValue(null);
    
    const req = mockRequest();
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ message: 'Organizer not found' });
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      reason: 'Organizer not found',
    }));
  });

  it('should return sanitized organizer data for superadmin', async () => {
    const mockOrganizer = {
      id: 'organizer-123',
      organizerName: 'Test Organizer',
      status: 'active',
      description: 'Test description',
      contactEmail: 'contact@test.com',
      contactPhone: '123-456-7890',
      website: 'https://test.com',
      address: {
        line1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'Testland',
      },
      user: {
        id: 'user-456',
        name: 'Test User',
        email: 'user@test.com',
      },
    };
    
    (payload.findByID as any).mockResolvedValue(mockOrganizer);
    
    const req = mockRequest();
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    // For superadmin, all data should be returned
    expect(data).toEqual(expect.objectContaining({
      id: mockOrganizer.id,
      organizerName: mockOrganizer.organizerName,
      status: mockOrganizer.status,
      description: mockOrganizer.description,
      contactEmail: mockOrganizer.contactEmail,
      contactPhone: mockOrganizer.contactPhone,
      website: mockOrganizer.website,
      address: mockOrganizer.address,
      user: expect.objectContaining({
        id: mockOrganizer.user.id,
        name: mockOrganizer.user.name,
        email: mockOrganizer.user.email,
      }),
    }));
    
    expect(logAccessAttempt).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
    }));
  });

  it('should return limited data for non-owner organizer role', async () => {
    const mockOrganizer = {
      id: 'organizer-123',
      organizerName: 'Test Organizer',
      status: 'active',
      description: 'Test description',
      contactEmail: 'contact@test.com',
      user: {
        id: 'user-456', // Different from the requesting user
      },
    };
    
    (payload.findByID as any).mockResolvedValue(mockOrganizer);
    
    // Set user as organizer who is not the owner
    (verifyOrganizerAccess as any).mockResolvedValue({
      response: null,
      user: {
        id: 'user-789', // Different ID from the organizer's user
        role: 'organizer',
      },
    });
    
    const req = mockRequest();
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(200);
    // For non-owner organizer, only limited data should be returned
    expect(data).toEqual(expect.objectContaining({
      id: mockOrganizer.id,
      organizerName: mockOrganizer.organizerName,
      status: mockOrganizer.status,
    }));
    
    // Sensitive fields should not be included
    expect(data).not.toHaveProperty('description');
    expect(data).not.toHaveProperty('contactEmail');
    expect(data).not.toHaveProperty('user');
  });

  it('should handle unexpected errors gracefully', async () => {
    (payload.findByID as any).mockRejectedValue(new Error('Database error'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const req = mockRequest();
    const response = await GET(req, { params: mockParams });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred while retrieving the organizer details' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 