import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from '../../src/components/auth/LoginForm';

// Mock the fetch function
global.fetch = vi.fn();

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock auth utilities
vi.mock('../../src/lib/auth', () => ({
  storeAuthData: vi.fn(),
}));

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<LoginForm />);
    
    // Try to submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
    
    // Fill in invalid email
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    
    // Try to submit with invalid email
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check for email validation error
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    // Mock successful fetch response
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'participant',
    };
    
    const mockResponse = {
      user: mockUser,
      token: 'mock-token',
    };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });
    
    // Import auth utilities after mocking
    const { storeAuthData } = await import('../../src/lib/auth');
    
    render(<LoginForm />);
    
    // Fill in valid credentials
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });
    
    // Check if auth data was stored
    await waitFor(() => {
      expect(storeAuthData).toHaveBeenCalledWith('mock-token', mockUser);
    });
  });

  it('handles login failure', async () => {
    // Mock failed fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid email or password' }),
    });
    
    render(<LoginForm />);
    
    // Fill in invalid credentials
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('handles unexpected errors', async () => {
    // Mock fetch to throw an error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    render(<LoginForm />);
    
    // Fill in credentials
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
    });
  });
}); 