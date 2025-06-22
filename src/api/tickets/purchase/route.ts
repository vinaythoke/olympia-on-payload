import { NextResponse } from 'next/server'
import payload from 'payload'
import { getPayloadCookie } from 'payload/dist/utilities/getPayloadCookie'

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json()
    const { ticketId, quantity, formResponses } = body
    
    // Validate required fields
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }
    
    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }
    
    // Get the user from the request
    const payloadToken = getPayloadCookie(req.headers.get('cookie') || '')
    if (!payloadToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Verify user exists
    const { user } = await payload.verifyToken(payloadToken)
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get the ticket details
    const ticket = await payload.findByID({
      collection: 'tickets',
      id: ticketId,
    })
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }
    
    // Check if ticket is available
    if (ticket.status !== 'active') {
      return NextResponse.json(
        { error: 'Ticket is not available for purchase' },
        { status: 400 }
      )
    }
    
    // Check if there are enough tickets available
    if ((ticket.remainingQuantity || 0) < quantity) {
      return NextResponse.json(
        { error: 'Not enough tickets available' },
        { status: 400 }
      )
    }
    
    // Get the event details
    const event = await payload.findByID({
      collection: 'events',
      id: ticket.event,
    })
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
    
    // Check if event is published
    if (event.status !== 'published') {
      return NextResponse.json(
        { error: 'Event is not available for ticket purchases' },
        { status: 400 }
      )
    }
    
    // Check ticket visibility rules if enabled
    if (ticket.visibilityRules?.enableRules) {
      // This would be where we check age, gender, location rules
      // For now, we'll just allow the purchase
    }
    
    // Calculate the total amount
    const unitPrice = ticket.type === 'paid' ? (ticket.price || 0) : 0
    const totalAmount = unitPrice * quantity
    
    // Create the purchase record
    const purchase = await payload.create({
      collection: 'ticket-purchases',
      data: {
        ticket: ticketId,
        event: ticket.event,
        purchaser: user.id,
        quantity,
        unitPrice,
        totalAmount,
        currency: ticket.type === 'paid' ? (ticket.currency || 'USD') : 'USD',
        formResponses,
        status: ticket.type === 'paid' ? 'pending' : 'completed',
        paymentMethod: ticket.type === 'paid' ? 'credit-card' : 'free',
      },
    })
    
    // If the ticket is free or RSVP, update the remaining quantity immediately
    if (ticket.type === 'free' || ticket.type === 'rsvp') {
      const newRemainingQuantity = Math.max(0, (ticket.remainingQuantity || 0) - quantity)
      
      await payload.update({
        collection: 'tickets',
        id: ticketId,
        data: {
          remainingQuantity: newRemainingQuantity,
          // If sold out, update the status
          ...(newRemainingQuantity === 0 ? { status: 'sold-out' } : {}),
        },
      })
    }
    
    // For paid tickets, we would integrate with a payment gateway here
    // For now, we'll just return the purchase details
    
    return NextResponse.json({
      success: true,
      purchase,
      message: ticket.type === 'paid' 
        ? 'Ticket purchase initiated. Please complete payment.' 
        : 'Ticket reserved successfully.',
    })
  } catch (error) {
    console.error('Error purchasing ticket:', error)
    return NextResponse.json(
      { error: 'Failed to process ticket purchase' },
      { status: 500 }
    )
  }
} 