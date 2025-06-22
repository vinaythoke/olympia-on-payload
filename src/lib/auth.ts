'use client';

import { useRouter } from 'next/navigation';

// Interface for user data
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'organizer' | 'participant' | 'volunteer';
  verification?: {
    status?: string;
  };
  profileComplete?: boolean;
}

// Token key in localStorage
const TOKEN_KEY = 'olympia_auth_token';
const USER_KEY = 'olympia_user';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Store user authentication data in localStorage
 */
export const storeAuthData = (token: string, user: User): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing auth data:', error);
  }
};

/**
 * Get the currently stored authentication token
 */
export const getToken = (): string | null => {
  if (!isBrowser) return null;
  
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Get the currently logged-in user
 */
export const getUser = (): User | null => {
  if (!isBrowser) return null;
  
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  return !!getToken();
};

/**
 * Check if the current user has a specific role
 */
export const hasRole = (role: string | string[]): boolean => {
  const user = getUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
};

/**
 * Log the user out
 */
export const logout = (redirectTo = '/login'): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Refresh the page or redirect
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

/**
 * React hook for using authentication
 */
export const useAuth = () => {
  const router = useRouter();

  return {
    user: getUser(),
    token: getToken(),
    isAuthenticated: isAuthenticated(),
    hasRole,
    logout: (redirectTo?: string) => {
      logout(redirectTo);
      router.refresh();
    },
    storeAuthData: (token: string, user: User) => {
      storeAuthData(token, user);
      router.refresh();
    }
  };
};

/**
 * Get the Payload CMS authentication token from cookies
 */
export const getPayloadToken = async (req: Request | { headers: { get: (name: string) => string | null } }): Promise<string | null> => {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  // Payload stores the token in a cookie named 'payload-token'
  return cookies['payload-token'] || null
} 