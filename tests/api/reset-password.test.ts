import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    resetPassword: vi.fn(),
  },
}));

// Import after mocking
import payload from 'payload';
import { POST } from '../../src/app/api/users/reset-password/route';

describe('Reset Password API Route', () => {
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

  it('should return 400 if token is missing', async () => {
    const req = mockRequest({ password: 'newpassword123' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Token and password are required' });
  });

  it('should return 400 if password is missing', async () => {
    const req = mockRequest({ token: 'valid-token' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Token and password are required' });
  });

  it('should return 400 if password is too short', async () => {
    const req = mockRequest({
      token: 'valid-token',
      password: 'short', // Too short
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Password must be at least 8 characters' });
  });

  it('should return 401 if token is invalid', async () => {
    const req = mockRequest({
      token: 'invalid-token',
      password: 'newpassword123',
    });
    
    // Mock payload.resetPassword to throw an invalid token error
    (payload.resetPassword as any).mockRejectedValueOnce(new Error('Invalid or expired token'));
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ message: 'Invalid or expired reset token' });
    expect(payload.resetPassword).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        token: 'invalid-token',
        password: 'newpassword123',
      },
    });
  });

  it('should return 200 if password reset succeeds', async () => {
    const req = mockRequest({
      token: 'valid-token',
      password: 'newpassword123',
    });
    
    // Mock successful resetPassword response
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };
    
    (payload.resetPassword as any).mockResolvedValueOnce({ user: mockUser });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'Password reset successfully' });
    expect(payload.resetPassword).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        token: 'valid-token',
        password: 'newpassword123',
      },
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    const req = mockRequest({
      token: 'valid-token',
      password: 'newpassword123',
    });
    
    // Mock payload.resetPassword to throw an unexpected error
    (payload.resetPassword as any).mockRejectedValueOnce(new Error('Database connection failed'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred while resetting your password' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 