import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { getPayloadToken } from '@/lib/auth'

export async function GET(req: Request) {
  const payload = await getPayloadHMR({ config })
  const token = await getPayloadToken(req)

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { user } = await payload.auth({
    headers: req.headers,
  })

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return new Response('Missing eventId query parameter', { status: 400 })
  }

  try {
    const ticketPurchases = await payload.find({
      collection: 'ticket-purchases',
      where: {
        event: {
          equals: eventId,
        },
        purchaser: {
          equals: user.id,
        },
      },
      depth: 1,
    })

    return NextResponse.json(ticketPurchases)
  } catch (error) {
    console.error('Error fetching ticket purchases:', error)
    return new Response('Error fetching ticket purchases', { status: 500 })
  }
}
