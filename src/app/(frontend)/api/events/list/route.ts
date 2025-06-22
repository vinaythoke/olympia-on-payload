import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { eventPaginationSchema } from '@/lib/events/validation'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())

    // Validate pagination and filter parameters
    const validationResult = eventPaginationSchema.safeParse(searchParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: validationResult.error.flatten() },
        { status: 400 },
      )
    }

    const { page, limit, sort, order, status } = validationResult.data

    const where: any = {}
    if (status) {
      where.status = {
        equals: status,
      }
    }

    // The access control rules in the 'events' collection will be applied automatically
    // because we are passing the `req` object. This will filter events based on
    // the user's role and the event's status (e.g., public sees 'published').
    const events = await payload.find({
      collection: 'events',
      page,
      limit,
      sort: sort || 'createdAt',
      where,
      req: req as any,
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error listing events:', error)
    return NextResponse.json(
      { message: 'An error occurred while retrieving events' },
      { status: 500 },
    )
  }
}
