import { z } from 'zod';

/**
 * Location object schema
 */
export const locationSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
}).optional();

/**
 * Schema for creating a new event
 */
export const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  organizer: z.string().min(1, "Organizer ID is required"),
  eventBanner: z.string().optional(),
  description: z.any().optional(),
  eventDate: z.string().refine((value: string) => {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }, { message: "Invalid date format" }),
  location: locationSchema,
  status: z.enum(['draft', 'published', 'cancelled']).default('draft'),
  capacity: z.number().int().positive().optional(),
  registrationForm: z.any().optional(),
});

/**
 * Schema for updating an existing event
 */
export const updateEventSchema = createEventSchema.partial();

/**
 * Schema for event ID validation
 */
export const eventIdSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
});

/**
 * Schema for pagination query parameters
 */
export const eventPaginationSchema = z.object({
  page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val, 10) : 10),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Schema for filtering events by organizer
 */
export const eventsByOrganizerSchema = z.object({
  organizerId: z.string().min(1, "Organizer ID is required"),
}).merge(eventPaginationSchema);

/**
 * Schema for filtering events by status
 */
export const eventsByStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled'])
}).merge(eventPaginationSchema);

/**
 * Schema for event status update
 */
export const updateEventStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled'])
}); 