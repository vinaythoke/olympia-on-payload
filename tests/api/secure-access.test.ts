import { describe, it, expect, vi } from 'vitest';
import { 
  sanitizeOrganizerData,
  canAccessOrganizer,
  redactErrorMessage
} from '../../src/lib/secureAccess';

describe('SecureAccess Utilities', () => {
  describe('sanitizeOrganizerData', () => {
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
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    };

    it('should return all data for superadmin users', () => {
      const superadminUser = { id: 'admin-123', role: 'superadmin' };
      
      const result = sanitizeOrganizerData(mockOrganizer, superadminUser);
      
      // Superadmin should see all fields
      expect(result).toEqual(mockOrganizer);
    });

    it('should return limited data for non-owner organizer users', () => {
      const organizerUser = { 
        id: 'different-user', // Different from the organizer's user
        role: 'organizer'
      };
      
      const result = sanitizeOrganizerData(mockOrganizer, organizerUser);
      
      // Should include basic fields
      expect(result.id).toBe(mockOrganizer.id);
      expect(result.organizerName).toBe(mockOrganizer.organizerName);
      expect(result.status).toBe(mockOrganizer.status);
      
      // Should not include sensitive fields
      expect(result).not.toHaveProperty('contactEmail');
      expect(result).not.toHaveProperty('contactPhone');
      expect(result).not.toHaveProperty('address');
      expect(result).not.toHaveProperty('user');
    });

    it('should return more data for owner organizer users', () => {
      const organizerUser = { 
        id: mockOrganizer.user.id, // Same as the organizer's user
        role: 'organizer'
      };
      
      const result = sanitizeOrganizerData(mockOrganizer, organizerUser);
      
      // Should include basic fields and owner-specific fields
      expect(result.id).toBe(mockOrganizer.id);
      expect(result.organizerName).toBe(mockOrganizer.organizerName);
      expect(result.status).toBe(mockOrganizer.status);
      expect(result.description).toBe(mockOrganizer.description);
      expect(result.contactEmail).toBe(mockOrganizer.contactEmail);
      expect(result.contactPhone).toBe(mockOrganizer.contactPhone);
      expect(result.website).toBe(mockOrganizer.website);
      expect(result.address).toEqual(mockOrganizer.address);
      
      // Should not include internal fields
      expect(result).not.toHaveProperty('user');
    });

    it('should return minimal data for public access (no user)', () => {
      const result = sanitizeOrganizerData(mockOrganizer, null);
      
      // Should only include public fields
      expect(result.id).toBe(mockOrganizer.id);
      expect(result.organizerName).toBe(mockOrganizer.organizerName);
      expect(result.status).toBe(mockOrganizer.status);
      
      // Should not include sensitive fields
      expect(result).not.toHaveProperty('description');
      expect(result).not.toHaveProperty('contactEmail');
      expect(result).not.toHaveProperty('contactPhone');
      expect(result).not.toHaveProperty('website');
      expect(result).not.toHaveProperty('address');
      expect(result).not.toHaveProperty('user');
    });

    it('should handle null or undefined organizer data', () => {
      const result = sanitizeOrganizerData(null, { id: 'user-123', role: 'superadmin' });
      
      // Should return an object with required fields
      expect(result).toEqual({
        id: '',
        organizerName: '',
        status: '',
      });
    });
  });

  describe('canAccessOrganizer', () => {
    it('should return true for superadmin users', () => {
      const superadminUser = { id: 'admin-123', role: 'superadmin' };
      
      const result = canAccessOrganizer('organizer-123', superadminUser);
      
      expect(result).toBe(true);
    });

    it('should return false for unauthenticated users', () => {
      const result = canAccessOrganizer('organizer-123', null);
      
      expect(result).toBe(false);
    });

    it('should return false for non-superadmin users without checking ownership', () => {
      // Note: The actual implementation would need to check if the user ID matches the organizer's user ID
      // This would typically require a database lookup, which is mocked/simplified in the implementation
      const organizerUser = { id: 'user-123', role: 'organizer' };
      
      const result = canAccessOrganizer('organizer-123', organizerUser);
      
      // This assumes the implementation returns false for non-superadmins without checking ownership
      // The actual implementation might be different depending on how ownership is checked
      expect(result).toBe(false);
    });
  });

  describe('redactErrorMessage', () => {
    it('should redact sensitive information from error messages', () => {
      const sensitiveMessage = 'Error: Cannot find user with email john.doe@example.com';
      
      const result = redactErrorMessage(sensitiveMessage);
      
      // Should redact email addresses
      expect(result).not.toContain('john.doe@example.com');
      expect(result).toContain('[REDACTED]');
    });

    it('should redact IDs from error messages', () => {
      const sensitiveMessage = 'Error: Cannot find document with ID 507f1f77bcf86cd799439011';
      
      const result = redactErrorMessage(sensitiveMessage);
      
      // Should redact IDs
      expect(result).not.toContain('507f1f77bcf86cd799439011');
      expect(result).toContain('[REDACTED]');
    });

    it('should return a generic error message for null or undefined input', () => {
      const result = redactErrorMessage(null);
      
      expect(result).toBe('An error occurred');
    });

    it('should preserve the general error type while redacting details', () => {
      const sensitiveMessage = 'Database Error: Failed to connect to database at mongodb://user:password@localhost:27017';
      
      const result = redactErrorMessage(sensitiveMessage);
      
      // Should keep the error type
      expect(result).toContain('Database Error');
      // But redact the connection string
      expect(result).not.toContain('mongodb://user:password@localhost:27017');
      expect(result).toContain('[REDACTED]');
    });
  });
}); 