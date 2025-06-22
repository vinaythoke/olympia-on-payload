import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { createAuditLog } from '@/lib/audit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // First, fetch the event to get its details for the audit log.
    // This also serves as a check to see if the user has read access.
    const eventToDelete = await payload.findByID({
      collection: 'events',
      id,
      req: req as any,
    })

    if (!eventToDelete) {
      return NextResponse.json({ message: 'Event not found or access denied' }, { status: 404 })
    }

    // Now, delete the event. The collection's access control will be re-evaluated
    // for the 'delete' operation.
    await payload.delete({
      collection: 'events',
      id,
      req: req as any,
    })

    // Create audit log for the deletion
    if (req.user) {
      await createAuditLog({
        payload,
        action: 'delete',
        entityType: 'event',
        entityId: String(id),
        details: {
          title: eventToDelete.title,
          status: eventToDelete.status,
          deletedVia: 'api',
        },
        userId: req.user.id,
        req,
      })
    }

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { message: 'You are not authorized to delete this event' },
        { status: 403 },
      )
    }
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { message: 'An error occurred while deleting the event' },
      { status: 500 },
    )
  }
}
