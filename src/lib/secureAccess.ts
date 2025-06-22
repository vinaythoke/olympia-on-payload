import { User } from '../payload-types'
import { sanitizeOrganizerData as sanitizeOrganizerDataFn } from './organizers/transforms'

/**
 * Re-export the sanitizeOrganizerData function from organizers module
 */
export const sanitizeOrganizerData = sanitizeOrganizerDataFn

/**
 * Check if a user has permission to access a specific organizer
 * @param organizerId - ID of the organizer to access
 * @param user - Current user
 * @returns Boolean indicating if access is allowed
 */
export function canAccessOrganizer(organizerId: string, user?: User | null): boolean {
  if (!user) return false
  
  // Superadmins can access all organizers
  if (user.role === 'superadmin') return true
  
  // Organizers can only access themselves (would need to check if user.id matches organizer.user.id)
  // This requires a database lookup in most cases, so it's often better to handle this in the API route
  
  return false
}

/**
 * Check if a user has permission to modify a specific organizer
 * @param organizerId - ID of the organizer to modify
 * @param user - Current user
 * @returns Boolean indicating if modification is allowed
 */
export function canModifyOrganizer(organizerId: string, user?: User | null): boolean {
  if (!user) return false
  
  // Only superadmins can modify organizers
  return user.role === 'superadmin'
}

/**
 * Check if a user has permission to change organizer status
 * @param organizerId - ID of the organizer to change status
 * @param user - Current user
 * @returns Boolean indicating if status change is allowed
 */
export function canChangeOrganizerStatus(organizerId: string, user?: User | null): boolean {
  if (!user) return false
  
  // Only superadmins can change organizer status
  return user.role === 'superadmin'
}

/**
 * Redacts sensitive information from error messages
 * @param error - Error object or message
 * @returns Safe error message for client response
 */
export function redactErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error types and provide safe messages
    if (error.message.includes('duplicate key')) {
      return 'A resource with that identifier already exists.'
    }
    
    if (error.message.includes('not found')) {
      return 'The requested resource was not found.'
    }
    
    if (error.message.includes('password')) {
      return 'There was an authentication error.'
    }
    
    // Generic safe message for other errors
    return 'An error occurred while processing your request.'
  }
  
  return 'An unknown error occurred.'
} 