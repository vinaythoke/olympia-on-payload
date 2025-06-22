import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  
  // Authentication check
  let authUser;
  try {
    const authResult = await payload.auth({ headers: req.headers });
    const userRole = authResult.user?.role || '';
    if (!authResult.user || !['superadmin', 'organizer', 'volunteer'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    authUser = authResult.user;
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ticketId, photoData, offlineTimestamp, userId, eventId } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    }

    // Find the ticket purchase
    const ticketPurchaseQuery = await payload.find({
      collection: 'ticket-purchases',
      where: {
        'ticketCode': {
          equals: ticketId,
        },
      },
      depth: 2, // To get related data
    });

    if (!ticketPurchaseQuery.docs || ticketPurchaseQuery.docs.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticketPurchase = ticketPurchaseQuery.docs[0];

    // Check if the ticket has already been checked in
    if (ticketPurchase.isCheckedIn) {
      return new Response(
        JSON.stringify({
          error: 'This ticket has already been used for entry',
          existingCheckIn: {
            timestamp: ticketPurchase.checkInTime,
            photo: ticketPurchase.checkInPhoto,
          },
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Upload the photo if provided
    let photoId = null;
    if (photoData) {
      // Convert base64 to file and upload to Media collection
      const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create a file object that payload can process
      const uploadedMedia = await payload.create({
        collection: 'media',
        data: {
          alt: `Check-in photo for ticket ${ticketId}`,
        },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: `check-in-${ticketId}-${Date.now()}.jpg`,
          size: buffer.length,
        },
      });

      photoId = uploadedMedia.id;
    }

    // Determine check-in time (use offline timestamp if provided)
    const checkInTime = offlineTimestamp 
      ? new Date(offlineTimestamp).toISOString() 
      : new Date().toISOString();

    // Mark ticket as checked in
    const updatedTicket = await payload.update({
      collection: 'ticket-purchases',
      id: ticketPurchase.id,
      data: {
        isCheckedIn: true,
        checkInTime: new Date().toISOString(),
        checkInPhoto: photoId,
      },
    });

    // Create an audit log
    await payload.create({
      collection: 'audit-logs',
      data: {
        action: 'status_change',
        entityType: 'event',
        entityId: typeof ticketPurchase.event === 'object' ? 
          ticketPurchase.event?.id?.toString() || 'unknown' : 
          ticketPurchase.event?.toString() || 'unknown',
        details: offlineTimestamp 
          ? `Ticket ${ticketId} checked in offline (synced later). Original check-in time: ${new Date(offlineTimestamp).toLocaleString()}`
          : `Ticket ${ticketId} checked in`,
        createdBy: userId || authUser.id, // Use provided userId for offline check-ins
      },
    });

    return NextResponse.json({
      success: true,
      status: 'checked_in',
      ticketPurchase: updatedTicket,
      wasOfflineSync: !!offlineTimestamp,
    });

  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 