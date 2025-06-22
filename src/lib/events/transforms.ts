import { Event, EventCreateInput, EventResponse, EventUpdateInput } from './types';

/**
 * Transforms an event response from the API to a standardized format
 */
export const transformEventResponse = (event: Event): EventResponse => {
  return {
    ...event,
  };
};

/**
 * Transforms an array of event responses from the API to a standardized format
 */
export const transformEventListResponse = (events: Event[]): EventResponse[] => {
  return events.map(transformEventResponse);
};

/**
 * Transforms input data for creating an event
 */
export const transformCreateEventInput = (input: EventCreateInput): Record<string, any> => {
  return {
    title: input.title,
    organizer: input.organizer,
    eventBanner: input.eventBanner || null,
    description: input.description || undefined,
    eventDate: input.eventDate,
    location: input.location || undefined,
    status: input.status || 'draft',
    capacity: input.capacity || undefined,
    registrationForm: input.registrationForm || undefined,
  };
};

/**
 * Transforms input data for updating an event
 */
export const transformUpdateEventInput = (input: EventUpdateInput): Record<string, any> => {
  const transformed: Record<string, any> = {};
  
  if (input.title !== undefined) transformed.title = input.title;
  if (input.organizer !== undefined) transformed.organizer = input.organizer;
  if (input.eventBanner !== undefined) transformed.eventBanner = input.eventBanner;
  if (input.description !== undefined) transformed.description = input.description;
  if (input.eventDate !== undefined) transformed.eventDate = input.eventDate;
  if (input.location !== undefined) transformed.location = input.location;
  if (input.status !== undefined) transformed.status = input.status;
  if (input.capacity !== undefined) transformed.capacity = input.capacity;
  if (input.registrationForm !== undefined) transformed.registrationForm = input.registrationForm;
  
  return transformed;
}; 