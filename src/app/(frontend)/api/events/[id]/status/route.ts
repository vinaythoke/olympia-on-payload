import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { updateEventStatusSchema } from '@/lib/events/validation'
import { createAuditLog } from '@/lib/audit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    // Validate the status update
    const validationResult = updateEventStatusSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid status data', errors: validationResult.error.flatten() },
        { status: 400 },
      )
    }

    // Get the current event to check permissions and for audit logging
    const currentEvent = await payload.findByID({
      collection: 'events',
      id,
      req: req as any,
    })

    if (!currentEvent) {
      return NextResponse.json({ message: 'Event not found or access denied' }, { status: 404 })
    }

    // Update the event status
    const updatedEvent = await payload.update({
      collection: 'events',
      id,
      data: validationResult.data,
      req: req as any,
    })

    // Create audit log for the status change
    if (req.user) {
      await createAuditLog({
        payload,
        action: 'status_change',
        entityType: 'event',
        entityId: String(id),
        details: {
          title: currentEvent.title,
          oldStatus: currentEvent.status,
          newStatus: validationResult.data.status,
          changedVia: 'api',
        },
        userId: req.user.id,
        req,
      })
    }

    return NextResponse.json({
      message: 'Event status updated successfully',
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        status: updatedEvent.status,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { message: 'You are not authorized to update this event' },
        { status: 403 },
      )
    }
    console.error('Error updating event status:', error)
    return NextResponse.json(
      { message: 'An error occurred while updating the event status' },
      { status: 500 },
    )
  }
}
