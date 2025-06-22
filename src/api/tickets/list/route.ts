import { NextResponse } from 'next/server'
import payload from 'payload'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const eventId = url.searchParams.get('eventId')

    // Get user session
    const session = await getServerSession(authOptions)

    // If no event ID provided, return bad request
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Query parameters for pagination and filtering
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const type = url.searchParams.get('type')

    // Build query
    const query: any = {
      event: { equals: eventId },
    }

    // Add type filter if provided
    if (type) {
      query.type = { equals: type }
    }

    // For non-authenticated users, only show public tickets for published events
    if (!session?.user) {
      query.visibility = { equals: 'public' }

      // Check if the event is published
      const event = await payload.findByID({
        collection: 'events',
        id: eventId,
      })

      if (!event || event.status !== 'published') {
        return NextResponse.json({ error: 'Event not found or not published' }, { status: 404 })
      }
    }

    // Get tickets
    const tickets = await payload.find({
      collection: 'tickets',
      where: query,
      page,
      limit,
      sort: 'name',
      depth: 0, // Don't need to populate relationships for listing
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}
