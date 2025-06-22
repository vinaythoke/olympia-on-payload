import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { generateQRCode } from '@/lib/qrcode'
import { getPayloadToken } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayloadHMR({ config })
    const token = await getPayloadToken(req)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the ticket purchase
    const ticketPurchase = await payload.findByID({
      collection: 'ticket-purchases',
      id,
      req: req as any,
    })

    if (!ticketPurchase) {
      return NextResponse.json({ error: 'Ticket purchase not found' }, { status: 404 })
    }

    // Generate QR code data
    const qrData = {
      ticketId: ticketPurchase.id,
      eventId: ticketPurchase.event?.id,
      purchaseId: ticketPurchase.id,
      timestamp: new Date().toISOString(),
    }

    // Generate QR code
    const qrCode = await generateQRCode(JSON.stringify(qrData))

    return new NextResponse(qrCode, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
