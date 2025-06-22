import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { updateEventSchema } from '@/lib/events/validation'
import { transformUpdateEventInput } from '@/lib/events/transforms'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const eventData = await req.json()

    // Validate the event data
    const validationResult = updateEventSchema.safeParse(eventData)
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid event data', errors: validationResult.error.flatten() },
        { status: 400 },
      )
    }

    // Transform the input
    const transformedData = transformUpdateEventInput(validationResult.data)

    // The access control on the 'events' collection will handle permissions.
    // It ensures that an organizer can only update their own events, and a
    // superadmin can update any event.
    const updatedEvent = await payload.update({
      collection: 'events',
      id,
      data: transformedData as any,
      req: req as any, // Pass req for access control and to get user
    })

    // Create audit log for the event update
    if (req.user) {
      await createAuditLog({
        payload,
        action: 'update',
        entityType: 'event',
        entityId: String(id),
        details: {
          title: updatedEvent.title,
          status: updatedEvent.status,
          updatedVia: 'api',
        },
        userId: req.user.id,
        req,
      })
    }

    // Return success response with updated event data
    return NextResponse.json({
      message: 'Event updated successfully',
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        status: updatedEvent.status,
        eventDate: updatedEvent.eventDate,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { message: 'You are not authorized to update this event' },
        { status: 403 },
      )
    }
    console.error('Error updating event:', error)

    // Generic error response
    return NextResponse.json(
      { message: 'An error occurred while updating the event' },
      { status: 500 },
    )
  }
}
