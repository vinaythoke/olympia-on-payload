/**
 * Type definitions for organizer management
 */

import { User } from '../../payload-types';

/**
 * Organizer status options
 */
export type OrganizerStatus = 'active' | 'inactive' | 'suspended';

/**
 * Address information structure
 */
export interface OrganizerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Structure for creating a new organizer
 */
export interface CreateOrganizerInput {
  name: string;
  email: string;
  password: string;
  organizerName: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: OrganizerAddress;
  status?: OrganizerStatus;
}

/**
 * Structure for updating an existing organizer
 */
export interface UpdateOrganizerInput {
  organizerName: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: OrganizerAddress;
  status?: OrganizerStatus;
}

/**
 * Structure for changing organizer status
 */
export interface ChangeOrganizerStatusInput {
  status: OrganizerStatus;
}

/**
 * Structure for organizer list filtering
 */
export interface OrganizerFilterOptions {
  status?: OrganizerStatus;
  page?: number;
  limit?: number;
}

/**
 * Structure for sanitized organizer data based on user role
 */
export interface SanitizedOrganizerData {
  id: string;
  organizerName: string;
  status: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: OrganizerAddress;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
} 