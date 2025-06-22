import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  storeAuthData, 
  getToken, 
  getUser, 
  isAuthenticated, 
  hasRole, 
  logout,
  useAuth
} from '../../src/lib/auth';
import { User } from '../../src/lib/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn((index: number) => ''),
  };
})();

// Mock window.location
const locationMock = {
  href: '',
};

// Mock Next.js router
const routerMock = {
  push: vi.fn(),
  refresh: vi.fn(),
};

// Mock user data
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'participant',
};

const mockSuperadmin: User = {
  id: 'admin-123',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'superadmin',
};

const mockToken = 'mock-jwt-token';

describe('Auth Utilities', () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    Object.defineProperty(window, 'location', { value: locationMock, writable: true });
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('storeAuthData', () => {
    it('should store token and user data in localStorage', () => {
      storeAuthData(mockToken, mockUser);
      
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('olympia_auth_token', mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('olympia_user', JSON.stringify(mockUser));
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      storeAuthData(mockToken, mockUser);
      
      expect(consoleSpy).toHaveBeenCalledWith('Error storing auth data:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getToken', () => {
    it('should return the stored token', () => {
      localStorageMock.getItem.mockReturnValueOnce(mockToken);
      
      const token = getToken();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('olympia_auth_token');
      expect(token).toBe(mockToken);
    });

    it('should return null if no token is stored', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const token = getToken();
      
      expect(token).toBeNull();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const token = getToken();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error getting token:', expect.any(Error));
      expect(token).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getUser', () => {
    it('should return the stored user data', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
      
      const user = getUser();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('olympia_user');
      expect(user).toEqual(mockUser);
    });

    it('should return null if no user data is stored', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const user = getUser();
      
      expect(user).toBeNull();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const user = getUser();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error getting user data:', expect.any(Error));
      expect(user).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if a token exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(mockToken);
      
      const authenticated = isAuthenticated();
      
      expect(authenticated).toBe(true);
    });

    it('should return false if no token exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const authenticated = isAuthenticated();
      
      expect(authenticated).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has the specified role', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
      
      const result = hasRole('participant');
      
      expect(result).toBe(true);
    });

    it('should return true if user has one of the specified roles in an array', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
      
      const result = hasRole(['organizer', 'participant']);
      
      expect(result).toBe(true);
    });

    it('should return false if user does not have the specified role', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
      
      const result = hasRole('organizer');
      
      expect(result).toBe(false);
    });

    it('should return false if user does not have any of the specified roles in an array', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
      
      const result = hasRole(['organizer', 'volunteer']);
      
      expect(result).toBe(false);
    });

    it('should return false if no user is logged in', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const result = hasRole('participant');
      
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove token and user data from localStorage', () => {
      logout();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('olympia_auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('olympia_user');
    });

    it('should redirect to the specified URL', () => {
      logout('/custom-redirect');
      
      expect(window.location.href).toBe('/custom-redirect');
    });

    it('should redirect to /login by default', () => {
      logout();
      
      expect(window.location.href).toBe('/login');
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logout();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error during logout:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
}); 