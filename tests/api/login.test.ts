import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    login: vi.fn(),
  },
}));

// Import after mocking
import payload from 'payload';
import { POST } from '../../src/app/api/users/login/route';

describe('Login API Route', () => {
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

  it('should return 400 if email is missing', async () => {
    const req = mockRequest({ password: 'password123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Email and password are required' });
  });

  it('should return 400 if password is missing', async () => {
    const req = mockRequest({ email: 'test@example.com' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Email and password are required' });
  });

  it('should return 401 if login fails', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'wrongpassword' });
    
    // Mock payload.login to throw an error
    (payload.login as any).mockRejectedValueOnce(new Error('Invalid credentials'));
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: 'Invalid email or password' });
    expect(payload.login).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        email: 'test@example.com',
        password: 'wrongpassword',
      },
    });
  });

  it('should return 200 with user data and token if login succeeds', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'password123' });
    
    // Mock successful login response
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'participant',
    };
    
    const mockLoginResponse = {
      user: mockUser,
      token: 'mock-jwt-token',
    };
    
    (payload.login as any).mockResolvedValueOnce(mockLoginResponse);
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      user: mockUser,
      token: 'mock-jwt-token',
    });
    expect(payload.login).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    const req = mockRequest({ email: 'test@example.com', password: 'password123' });
    
    // Mock payload.login to throw an unexpected error
    (payload.login as any).mockRejectedValueOnce(new Error('Database connection failed'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred during login' });
    expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
}); 