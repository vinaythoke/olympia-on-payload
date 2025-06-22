import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    create: vi.fn(),
  },
}));

// Import after mocking
import payload from 'payload';
import { POST } from '../../src/app/api/users/register/route';

describe('Register API Route', () => {
  const mockRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = mockRequest({ email: 'test@example.com' }); // Missing password and name
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Email, password, and name are required' });
  });

  it('should return 400 if email is invalid', async () => {
    const req = mockRequest({
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Invalid email format' });
  });

  it('should return 400 if password is too short', async () => {
    const req = mockRequest({
      email: 'test@example.com',
      password: 'short', // Too short
      name: 'Test User',
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Password must be at least 8 characters' });
  });

  it('should return 409 if user already exists', async () => {
    const req = mockRequest({
      email: 'existing@example.com',
      password: 'password123',
      name: 'Test User',
    });
    
    // Mock payload.create to throw a conflict error
    (payload.create as any).mockRejectedValueOnce({
      errors: [{ message: 'A user with the given email address already exists' }],
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data).toEqual({ message: 'A user with this email already exists' });
    expect(payload.create).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'participant',
      },
    });
  });

  it('should return 201 with user data if registration succeeds', async () => {
    const req = mockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    
    // Mock successful registration response
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'participant',
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
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'participant',
      },
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    const req = mockRequest({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    
    // Mock payload.create to throw an unexpected error
    (payload.create as any).mockRejectedValueOnce(new Error('Database connection failed'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred during registration' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 