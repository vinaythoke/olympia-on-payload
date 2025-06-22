'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { WifiOff } from 'lucide-react'
import { getCachedTickets, cacheTicket } from '@/lib/offlineStorage'
import { TicketPurchase } from '@/payload-types'
import { QRCodeModal } from './QRCodeModal'
import { getPayloadToken } from '../../lib/auth'

interface Ticket {
  id: string
  name: string
  description: string
  type: 'free' | 'paid' | 'rsvp' | 'protected'
  price?: number
  currency?: string
  remainingQuantity: number
  status: 'active' | 'inactive' | 'sold-out'
}

interface TicketPurchaseListProps {
  eventId?: string | number
}

export function TicketPurchaseList({ eventId }: TicketPurchaseListProps) {
  const [purchases, setPurchases] = useState<TicketPurchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  // Check network status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine)
    }

    // Initial check
    updateOnlineStatus()

    // Listen for changes
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    async function fetchTicketPurchases() {
      try {
        const token = await getPayloadToken(new Request(window.location.href))
        const endpoint = eventId ? `/api/tickets/list?eventId=${eventId}` : '/api/tickets/list'

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch ticket purchases')
        }
        const data = await response.json()
        setPurchases(data.docs)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTicketPurchases()
  }, [eventId])

  const formatPrice = (price: number, currency: string = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    })
    return formatter.format(price)
  }

  const getTicketTypeLabel = (type: Ticket['type']) => {
    switch (type) {
      case 'free':
        return <Badge variant="outline">Free</Badge>
      case 'paid':
        return <Badge>Paid</Badge>
      case 'rsvp':
        return <Badge variant="secondary">RSVP</Badge>
      case 'protected':
        return <Badge variant="destructive">Protected</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading tickets...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
        <p>Error: {error}</p>
      </div>
    )
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 my-4">
        <p>No tickets found.</p>
      </div>
    )
  }

  return (
    <>
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 mb-4 flex items-center gap-2">
          <WifiOff size={16} />
          <p>You're currently offline. Showing cached tickets.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id} className={purchase.status !== 'active' ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>
                  {typeof purchase.ticket === 'object' ? purchase.ticket.name : 'Ticket'}
                </CardTitle>
                {getTicketTypeLabel(
                  typeof purchase.ticket === 'object' ? purchase.ticket.type : 'paid',
                )}
              </div>
              <CardDescription>
                {typeof purchase.ticket === 'object' ? purchase.ticket.description : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {typeof purchase.ticket === 'object' &&
                  typeof purchase.ticket.price === 'number' && (
                    <div className="text-xl font-bold">
                      {formatPrice(
                        purchase.ticket.price,
                        typeof purchase.ticket.currency === 'string'
                          ? purchase.ticket.currency
                          : 'USD',
                      )}
                    </div>
                  )}
                <div className="text-sm">
                  {typeof purchase.ticket === 'object' && purchase.ticket.remainingQuantity > 0 ? (
                    <span>{purchase.ticket.remainingQuantity} tickets remaining</span>
                  ) : (
                    <span className="text-red-500">Sold out</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <Badge>{purchase.status}</Badge>
                <QRCodeModal ticketPurchaseId={purchase.id} />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  )
}
