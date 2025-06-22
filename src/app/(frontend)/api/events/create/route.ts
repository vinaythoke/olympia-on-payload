import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { createAuditLog } from '@/lib/audit'
import { createEventSchema } from '@/lib/events/validation'
import { transformCreateEventInput } from '@/lib/events/transforms'

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json()

    // Validate the event data
    const validationResult = createEventSchema.safeParse(eventData)
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid event data', errors: validationResult.error.flatten() },
        { status: 400 },
      )
    }

    // Transform the input
    const transformedData = transformCreateEventInput(validationResult.data)

    // The access control on the 'events' collection will handle permissions.
    // It ensures that an organizer can only create an event for their own
    // organizer profile, and a superadmin can create for any.
    const event = await payload.create({
      collection: 'events',
      data: transformedData as any,
      req: req as any, // Pass req for access control and to get user
    })

    // Create audit log for the event creation
    if (req.user) {
      await createAuditLog({
        payload,
        action: 'create',
        entityType: 'event',
        entityId: String(event.id),
        details: {
          title: event.title,
          status: event.status,
          createdVia: 'api',
        },
        userId: req.user.id,
        req,
      })
    }

    // Return success response with event data
    return NextResponse.json({
      message: 'Event created successfully',
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        eventDate: event.eventDate,
      },
    })
  } catch (error) {
    console.error('Error creating event:', error)

    // Generic error response
    return NextResponse.json(
      { message: 'An error occurred while creating the event' },
      { status: 500 },
    )
  }
}
