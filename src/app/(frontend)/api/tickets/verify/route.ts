import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { getPayloadToken } from '@/lib/auth'

export async function POST(req: Request) {
  const payload = await getPayloadHMR({ config })
  const token = await getPayloadToken(req)

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { user } = await payload.auth({
    headers: req.headers,
  })

  if (
    !user ||
    (user.role !== 'volunteer' && user.role !== 'organizer' && user.role !== 'superadmin')
  ) {
    return new Response('Forbidden', { status: 403 })
  }

  const { ticketCode } = await req.json()

  if (!ticketCode) {
    return new Response('Missing ticketCode', { status: 400 })
  }

  try {
    const ticketPurchases = await payload.find({
      collection: 'ticket-purchases',
      where: {
        ticketCode: {
          equals: ticketCode,
        },
      },
      depth: 1,
    })

    if (ticketPurchases.docs.length === 0) {
      return new Response('Invalid ticket code', { status: 404 })
    }

    const ticketPurchase = ticketPurchases.docs[0]

    if (ticketPurchase.isCheckedIn) {
      await payload.create({
        collection: 'audit-logs',
        data: {
          action: 'access_attempt',
          entityType: 'ticket',
          entityId: ticketPurchase.id.toString(),
          details: `Attempt to check in an already used ticket. User: ${user.email}`,
          createdBy: user.id,
        },
      })
      return new Response('Ticket already checked in', { status: 409 })
    }

    // Mark ticket as checked in
    await payload.update({
      collection: 'ticket-purchases',
      id: ticketPurchase.id,
      data: {
        isCheckedIn: true,
        checkInTime: new Date().toISOString(),
      },
    })

    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'update',
        entityType: 'ticket',
        entityId: ticketPurchase.id.toString(),
        details: `Ticket checked in successfully. User: ${user.email}`,
        createdBy: user.id,
      },
    })

    return NextResponse.json({ success: true, ticketPurchase })
  } catch (error) {
    console.error('Error verifying ticket:', error)
    return new Response('Error verifying ticket', { status: 500 })
  }
}
