import payload from 'payload';
import { Event, EventCreateInput, EventListResponse, EventResponse, EventUpdateInput } from './types';
import { transformCreateEventInput, transformEventResponse, transformUpdateEventInput } from './transforms';

/**
 * Create a new event
 */
export async function createEvent(input: EventCreateInput): Promise<EventResponse> {
  const transformedInput = transformCreateEventInput(input);
  
  const response = await payload.create({
    collection: 'events',
    data: transformedInput,
  });
  
  return transformEventResponse(response as Event);
}

/**
 * Update an event by ID
 */
export async function updateEvent(id: string | number, input: EventUpdateInput): Promise<EventResponse> {
  const transformedInput = transformUpdateEventInput(input);
  
  const response = await payload.update({
    collection: 'events',
    id,
    data: transformedInput,
  });
  
  return transformEventResponse(response as Event);
}

/**
 * Delete an event by ID
 */
export async function deleteEvent(id: string | number): Promise<void> {
  await payload.delete({
    collection: 'events',
    id,
  });
}

/**
 * Get a single event by ID
 */
export async function getEvent(id: string | number): Promise<EventResponse> {
  const response = await payload.findByID({
    collection: 'events',
    id,
  });
  
  return transformEventResponse(response as Event);
}

/**
 * Get a list of events with pagination
 */
export async function listEvents(page = 1, limit = 10, sort = 'createdAt', order: 'asc' | 'desc' = 'desc'): Promise<EventListResponse> {
  const response = await payload.find({
    collection: 'events',
    page,
    limit,
    sort,
    where: {},
  });
  
  return {
    ...response,
    docs: (response.docs as Event[]).map(transformEventResponse),
  };
}

/**
 * Get events by organizer
 */
export async function getEventsByOrganizer(
  organizerId: string | number,
  page = 1,
  limit = 10,
  sort = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
): Promise<EventListResponse> {
  const response = await payload.find({
    collection: 'events',
    page,
    limit,
    sort,
    where: {
      organizer: {
        equals: organizerId,
      },
    },
  });
  
  return {
    ...response,
    docs: (response.docs as Event[]).map(transformEventResponse),
  };
}

/**
 * Get events by status
 */
export async function getEventsByStatus(
  status: 'draft' | 'published' | 'cancelled',
  page = 1,
  limit = 10,
  sort = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
): Promise<EventListResponse> {
  const response = await payload.find({
    collection: 'events',
    page,
    limit,
    sort,
    where: {
      status: {
        equals: status,
      },
    },
  });
  
  return {
    ...response,
    docs: (response.docs as Event[]).map(transformEventResponse),
  };
}

/**
 * Update event status
 */
export async function updateEventStatus(id: string | number, status: 'draft' | 'published' | 'cancelled'): Promise<EventResponse> {
  return updateEvent(id, { status });
}

/**
 * Export all functions and types
 */
export * from './types';
export * from './transforms';
export * from './validation'; 