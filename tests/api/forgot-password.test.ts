import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock payload
vi.mock('payload', () => ({
  default: {
    forgotPassword: vi.fn(),
  },
}));

// Import after mocking
import payload from 'payload';
import { POST } from '../../src/app/api/users/forgot-password/route';

describe('Forgot Password API Route', () => {
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
    const req = mockRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Email is required' });
  });

  it('should return 400 if email is invalid', async () => {
    const req = mockRequest({ email: 'invalid-email' });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: 'Invalid email format' });
  });

  it('should return 200 if forgot password request succeeds', async () => {
    const req = mockRequest({ email: 'test@example.com' });
    
    // Mock successful forgotPassword response
    (payload.forgotPassword as any).mockResolvedValueOnce({
      message: 'Success',
    });
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'If an account with that email exists, a password reset link has been sent' });
    expect(payload.forgotPassword).toHaveBeenCalledWith({
      collection: 'users',
      data: {
        email: 'test@example.com',
      },
    });
  });

  it('should return 200 even if email does not exist (for security)', async () => {
    const req = mockRequest({ email: 'nonexistent@example.com' });
    
    // Mock forgotPassword to throw a not found error
    (payload.forgotPassword as any).mockRejectedValueOnce(new Error('User not found'));
    
    const response = await POST(req);
    const data = await response.json();

    // Still return 200 for security reasons (don't reveal if email exists)
    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'If an account with that email exists, a password reset link has been sent' });
  });

  it('should handle unexpected errors gracefully', async () => {
    const req = mockRequest({ email: 'test@example.com' });
    
    // Mock payload.forgotPassword to throw an unexpected error
    (payload.forgotPassword as any).mockRejectedValueOnce(new Error('Email service unavailable'));
    
    // Mock console.error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ message: 'An error occurred while processing your request' });
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
}); 