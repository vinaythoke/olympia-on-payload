import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get the event, passing the req object to enforce access control
    const event = await payload.findByID({
      collection: 'events',
      id,
      req: req as any,
    })

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    // Return the event
    return NextResponse.json({ event })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 })
    }
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { message: 'An error occurred while fetching the event' },
      { status: 500 },
    )
  }
}
