import { NextRequest, NextResponse } from 'next/server'
import payload from 'payload'
import { TicketPurchase } from '../../../../../payload-types'
import { createAuditLog } from '@/lib/audit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const registrationData = await req.json()

    // Validate that the event exists and is published
    const event = await payload.findByID({
      collection: 'events',
      id,
      req: req as any,
    })

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    if (event.status !== 'published') {
      return NextResponse.json(
        { message: 'Event is not available for registration' },
        { status: 400 },
      )
    }

    // Create the registration
    const registration = await payload.create({
      collection: 'form-submissions',
      data: {
        event: id,
        formData: registrationData,
        status: 'submitted',
      },
      req: req as any,
    })

    // Create audit log for the registration
    if (req.user) {
      await createAuditLog({
        payload,
        action: 'register',
        entityType: 'event',
        entityId: String(id),
        details: {
          title: event.title,
          registrationId: registration.id,
          registeredVia: 'api',
        },
        userId: req.user.id,
        req,
      })
    }

    return NextResponse.json({
      message: 'Registration successful',
      registration: {
        id: registration.id,
        status: registration.status,
      },
    })
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json(
      { message: 'An error occurred while creating the registration' },
      { status: 500 },
    )
  }
}
