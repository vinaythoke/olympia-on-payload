/**
 * Transform functions for organizer data
 */

import { User } from '../../payload-types';
import { SanitizedOrganizerData } from './types';

/**
 * Sanitizes organizer data based on user role
 * @param organizerData - Raw organizer data from database
 * @param user - Current user requesting the data
 * @returns Sanitized organizer data appropriate for the user's role
 */
export function sanitizeOrganizerData(organizerData: any, user?: User | null): SanitizedOrganizerData {
  // If no data, return empty object with required fields
  if (!organizerData) {
    return {
      id: '',
      organizerName: '',
      status: '',
    };
  }
  
  // Clone the data to avoid modifying the original
  const sanitized = { ...organizerData };
  
  // Superadmins can see everything
  if (user?.role === 'superadmin') {
    return sanitized as SanitizedOrganizerData;
  }
  
  // Organizers can only see their own data
  if (user?.role === 'organizer') {
    // If this is not the organizer's own data, return minimal info
    if (sanitized.user?.id !== user.id) {
      return {
        id: sanitized.id,
        organizerName: sanitized.organizerName,
        status: sanitized.status,
      };
    }
    
    // For own data, remove any sensitive internal fields
    const { _status, createdAt, updatedAt, ...safeData } = sanitized;
    
    return safeData as SanitizedOrganizerData;
  }
  
  // For participants and volunteers, return only public information
  return {
    id: sanitized.id,
    organizerName: sanitized.organizerName,
    status: sanitized.status === 'active' ? 'active' : 'unavailable', // Hide specific inactive states
    contactEmail: sanitized.contactEmail,
    website: sanitized.website,
  };
}

/**
 * Formats organizer data for display in lists
 * @param organizer - Organizer data
 * @returns Formatted organizer data for list display
 */
export function formatOrganizerForList(organizer: any): Record<string, any> {
  return {
    id: organizer.id,
    organizerName: organizer.organizerName,
    status: organizer.status,
    contactEmail: organizer.contactEmail,
    userName: organizer.user?.name || 'Unknown',
    userEmail: organizer.user?.email || 'Unknown',
  };
}

/**
 * Transforms API response data for client use
 * @param organizer - Organizer data from API
 * @returns Transformed organizer data for client
 */
export function transformOrganizerResponse(organizer: any): Record<string, any> {
  // Extract user info if present
  const userInfo = organizer.user ? {
    id: organizer.user.id,
    name: organizer.user.name,
    email: organizer.user.email,
  } : undefined;
  
  return {
    id: organizer.id,
    organizerName: organizer.organizerName,
    description: organizer.description || '',
    status: organizer.status,
    contactEmail: organizer.contactEmail || '',
    contactPhone: organizer.contactPhone || '',
    website: organizer.website || '',
    address: organizer.address || {},
    user: userInfo,
    createdAt: organizer.createdAt,
    updatedAt: organizer.updatedAt,
  };
} 