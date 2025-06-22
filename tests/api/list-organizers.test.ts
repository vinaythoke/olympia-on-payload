import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    find: vi.fn(),
  },
}));

// Mock auth utilities
vi.mock('../../src/lib/auth', () => ({
  getToken: vi.fn(),
  getUser: vi.fn(),
  hasRole: vi.fn(),
}));

// Import after mocking
import payload from 'payload';
import { getToken, getUser, hasRole } from '../../src/lib/auth';
import { GET } from '../../src/app/api/organizers/list/route';

describe('List Organizers API Route', () => {
  const mockRequest = (params = {}) => {
    const url = new URL('https://example.com/api/organizers/list');
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value as string);
    });
    
    return {
      url,
      headers: {
        get: vi.fn((header) => {
          if (header === 'Authorization') return 'Bearer mock-token';
          return null;
        }),
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for auth functions
    (getToken as any).mockReturnValue('mock-token');
    (getUser as any).mockReturnValue({
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'superadmin',
    });
    (hasRole as any).mockReturnValue(true); // Default to having superadmin role
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    (getToken as any).mockReturnValue(null);
    
    const req = mockRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: 'Unauthorized' });
  });

  it('should return 403 if not a superadmin', async () => {
    (hasRole as any).mockReturnValue(false);
    
    const req = mockRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ message: 'Forbidden: Only superadmins can view organizers' });
  });

  it('should return organizers with default pagination', async () => {
    const mockOrganizers = [
      {
        id: 'org-1',
        email: 'org1@example.com',
        name: 'Organizer 1',
        role: 'organizer',
      },
      {
        id: 'org-2',
        email: 'org2@example.com',
        name: 'Organizer 2',
        role: 'organizer',
      },
    ];
    
    (payload.find as any).mockResolvedValueOnce({
      docs: mockOrganizers,
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
    
    const req = mockRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      organizers: mockOrganizers,
      totalDocs: 2,
      page: 1,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
    
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'users',
      where: {
        role: { equals: 'organizer' },
      },
      page: 1,
      limit: 10,
    });
  });

  it('should handle custom pagination parameters', async () => {
    const mockOrganizers = [
      {
        id: 'org-3',
        email: 'org3@example.com',
        name: 'Organizer 3',
        role: 'organizer',
      },
    ];
    
    (payload.find as any).mockResolvedValueOnce({
      docs: mockOrganizers,
      totalDocs: 5,
      page: 2,
      totalPages: 3,
      hasPrevPage: true,
      hasNextPage: true,
      prevPage: 1,
      nextPage: 3,
    });
    
    const req = mockRequest({ page: '2', limit: '2' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      organizers: mockOrganizers,
      totalDocs: 5,
      page: 2,
      totalPages: 3,
      hasPrevPage: true,
      hasNextPage: true,
      prevPage: 1,
      nextPage: 3,
    });
    
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'users',
      where: {
        role: { equals: 'organizer' },
      },
      page: 2,
      limit: 2,
    });
  });

  it('should handle search parameter', async () => {
    const mockOrganizers = [
      {
        id: 'org-1',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'organizer',
      },
    ];
    
    (payload.find as any).mockResolvedValueOnce({
      docs: mockOrganizers,
      totalDocs: 1,
      page: 1,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
    
    const req = mockRequest({ search: 'john' });
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      organizers: mockOrganizers,
      totalDocs: 1,
      page: 1,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
    
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'users',
      where: {
        and: [
          { role: { equals: 'organizer' } },
          {
            or: [
              { email: { like: 'john' } },
              { name: { like: 'john' } },
            ],
          },
        ],
      },
      page: 1,
      limit: 10,
    });
  });

  it('should handle empty results', async () => {
    (payload.find as any).mockResolvedValueOnce({
      docs: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
    
    const req = mockRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      organizers: [],
      totalDocs: 0,
      page: 1,
      totalPages: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    (payload.find as any).mockRejectedValueOnce(new Error('Database connection failed'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const req = mockRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred while fetching organizers' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 