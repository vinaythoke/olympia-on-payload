/**
 * Validation functions for organizer management
 */

import { OrganizerStatus, CreateOrganizerInput, UpdateOrganizerInput } from './types';

/**
 * Validates organizer status value
 * @param status - Status to validate
 * @returns Boolean indicating if status is valid
 */
export function isValidOrganizerStatus(status: string): status is OrganizerStatus {
  return ['active', 'inactive', 'suspended'].includes(status);
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns Boolean indicating if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates website URL format
 * @param website - Website URL to validate
 * @returns Boolean indicating if website format is valid
 */
export function isValidWebsite(website?: string): boolean {
  if (!website) return true;
  try {
    new URL(website);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates phone number format
 * @param phone - Phone number to validate
 * @returns Boolean indicating if phone format is valid
 */
export function isValidPhone(phone?: string): boolean {
  if (!phone) return true;
  // Basic validation - can be enhanced for specific formats
  return phone.length >= 10 && /^[+\d\s()-]+$/.test(phone);
}

/**
 * Validates create organizer input
 * @param input - Create organizer data
 * @returns Object with validation result and error messages
 */
export function validateCreateOrganizerInput(input: CreateOrganizerInput): { 
  isValid: boolean; 
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!input.name?.trim()) errors.name = 'Name is required';
  if (!input.email?.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(input.email)) errors.email = 'Invalid email format';
  
  if (!input.password?.trim()) errors.password = 'Password is required';
  else if (input.password.length < 8) errors.password = 'Password must be at least 8 characters';
  
  if (!input.organizerName?.trim()) errors.organizerName = 'Organizer name is required';
  
  // Optional fields with format validation
  if (input.contactEmail && !isValidEmail(input.contactEmail)) {
    errors.contactEmail = 'Invalid contact email format';
  }
  
  if (input.website && !isValidWebsite(input.website)) {
    errors.website = 'Invalid website URL format';
  }
  
  if (input.contactPhone && !isValidPhone(input.contactPhone)) {
    errors.contactPhone = 'Invalid phone number format';
  }
  
  // Status validation
  if (input.status && !isValidOrganizerStatus(input.status)) {
    errors.status = 'Invalid status value. Must be active, inactive, or suspended';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates update organizer input
 * @param input - Update organizer data
 * @returns Object with validation result and error messages
 */
export function validateUpdateOrganizerInput(input: UpdateOrganizerInput): { 
  isValid: boolean; 
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Required fields
  if (!input.organizerName?.trim()) errors.organizerName = 'Organizer name is required';
  
  // Optional fields with format validation
  if (input.contactEmail && !isValidEmail(input.contactEmail)) {
    errors.contactEmail = 'Invalid contact email format';
  }
  
  if (input.website && !isValidWebsite(input.website)) {
    errors.website = 'Invalid website URL format';
  }
  
  if (input.contactPhone && !isValidPhone(input.contactPhone)) {
    errors.contactPhone = 'Invalid phone number format';
  }
  
  // Status validation
  if (input.status && !isValidOrganizerStatus(input.status)) {
    errors.status = 'Invalid status value. Must be active, inactive, or suspended';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
} 