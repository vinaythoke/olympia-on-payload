import { NextResponse } from 'next/server'
import payload from 'payload'

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json()
    const { ticketCode } = body
    
    // Validate required fields
    if (!ticketCode) {
      return NextResponse.json(
        { error: 'Ticket code is required' },
        { status: 400 }
      )
    }
    
    // Find the ticket purchase by code
    const purchases = await payload.find({
      collection: 'ticket-purchases',
      where: {
        ticketCode: { equals: ticketCode },
      },
      depth: 2, // Get related ticket and event details
    })
    
    if (!purchases.docs || purchases.docs.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ticket code' },
        { status: 404 }
      )
    }
    
    const purchase = purchases.docs[0]
    
    // Check if the ticket is valid
    if (purchase.status !== 'completed') {
      return NextResponse.json({
        valid: false,
        message: `Ticket status is ${purchase.status}`,
        purchase: {
          purchaseId: purchase.purchaseId,
          status: purchase.status,
        },
      })
    }
    
    // Get ticket and event details
    const ticket = typeof purchase.ticket === 'object' ? purchase.ticket : null
    const event = typeof purchase.event === 'object' ? purchase.event : null
    
    if (!ticket || !event) {
      return NextResponse.json(
        { error: 'Ticket or event data not found' },
        { status: 500 }
      )
    }
    
    // Return ticket verification result
    return NextResponse.json({
      valid: true,
      message: 'Valid ticket',
      purchase: {
        purchaseId: purchase.purchaseId,
        purchaseDate: purchase.purchaseDate,
        quantity: purchase.quantity,
        status: purchase.status,
      },
      ticket: {
        name: ticket.name,
        type: ticket.type,
      },
      event: {
        title: event.title,
        eventDate: event.eventDate,
        location: event.location,
      },
    })
  } catch (error) {
    console.error('Error verifying ticket:', error)
    return NextResponse.json(
      { error: 'Failed to verify ticket' },
      { status: 500 }
    )
  }
} 