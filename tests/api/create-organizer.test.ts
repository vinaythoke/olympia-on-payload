import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    create: vi.fn(),
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
import { POST } from '../../src/app/api/organizers/create/route';

describe('Create Organizer API Route', () => {
  const mockRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
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
    
    const req = mockRequest({
      email: 'organizer@example.com',
      name: 'Organizer Name',
      password: 'password123',
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: 'Unauthorized' });
  });

  it('should return 403 if not a superadmin', async () => {
    (hasRole as any).mockReturnValue(false);
    
    const req = mockRequest({
      email: 'organizer@example.com',
      name: 'Organizer Name',
      password: 'password123',
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ message: 'Forbidden: Only superadmins can create organizers' });
  });

  it('should return 400 if required fields are missing', async () => {
    const req = mockRequest({ email: 'organizer@example.com' }); // Missing name and password
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Email, password, and name are required' });
  });

  it('should return 400 if email is invalid', async () => {
    const req = mockRequest({
      email: 'invalid-email',
      name: 'Organizer Name',
      password: 'password123',
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Invalid email format' });
  });

  it('should return 400 if password is too short', async () => {
    const req = mockRequest({
      email: 'organizer@example.com',
      name: 'Organizer Name',
      password: 'short', // Too short
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Password must be at least 8 characters' });
  });

  it('should return 409 if user already exists', async () => {
    const req = mockRequest({
      email: 'existing@example.com',
      name: 'Organizer Name',
      password: 'password123',
    });
    
    // Mock payload.create to throw a conflict error
    (payload.create as any).mockRejectedValueOnce({
      errors: [{ message: 'A user with the given email address already exists' }],
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ message: 'A user with this email already exists' });
  });

  it('should return 201 with user data if organizer creation succeeds', async () => {
    const req = mockRequest({
      email: 'organizer@example.com',
      name: 'Organizer Name',
      password: 'password123',
    });
    
    // Mock successful user creation response
    const mockUser = {
      id: 'user-123',
      email: 'organizer@example.com',
      name: 'Organizer Name',
      role: 'organizer',
      createdAt: '2023-06-21T00:00:00.000Z',
      updatedAt: '2023-06-21T00:00:00.000Z',
    };
    
    (payload.create as any).mockResolvedValueOnce({ doc: mockUser });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({ user: mockUser });
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        email: 'organizer@example.com',
        name: 'Organizer Name',
        password: 'password123',
        role: 'organizer',
      },
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    const req = mockRequest({
      email: 'organizer@example.com',
      name: 'Organizer Name',
      password: 'password123',
    });
    
    // Mock payload.create to throw an unexpected error
    (payload.create as any).mockRejectedValueOnce(new Error('Database connection failed'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred while creating the organizer' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 