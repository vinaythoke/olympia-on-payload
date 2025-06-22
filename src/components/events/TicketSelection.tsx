'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Ticket } from '@/payload-types'
import { toast } from 'sonner'

interface TicketSelectionProps {
  eventId: string
  onSelectionChange: (selection: { [ticketId: string]: number }) => void
}

export function TicketSelection({ eventId, onSelectionChange }: TicketSelectionProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<{ [ticketId: string]: number }>({})

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/tickets/list?eventId=${eventId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch tickets')
        }
        const data = await response.json()
        setTickets(data.docs || [])
      } catch (error) {
        toast.error('Error loading tickets', {
          description:
            error instanceof Error ? error.message : 'Could not load tickets for this event.',
        })
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchTickets()
    }
  }, [eventId])

  const handleQuantityChange = (ticketId: string, quantity: number) => {
    const ticket = tickets.find((t) => t.id.toString() === ticketId)
    if (!ticket) return

    const remaining = ticket.remainingQuantity ?? 0
    const newQuantity = Math.max(0, Math.min(quantity, remaining)) // Ensure quantity is not negative and not more than remaining
    const newSelection = { ...selection, [ticketId]: newQuantity }
    setSelection(newSelection)
    onSelectionChange(newSelection)
  }

  if (loading) {
    return <div>Loading tickets...</div>
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id}>
          <CardHeader>
            <CardTitle>{ticket.name}</CardTitle>
            <CardDescription>{ticket.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="font-bold">{ticket.price ? `$${ticket.price.toFixed(2)}` : 'Free'}</p>
              <p className="text-sm text-muted-foreground">
                {(ticket.remainingQuantity ?? 0 > 0)
                  ? `${ticket.remainingQuantity} remaining`
                  : 'Sold out'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleQuantityChange(ticket.id.toString(), (selection[ticket.id] || 0) - 1)
                }
                disabled={!selection[ticket.id] || selection[ticket.id] <= 0}
              >
                -
              </Button>
              <Input
                type="number"
                className="w-16 text-center"
                value={selection[ticket.id] || 0}
                onChange={(e) =>
                  handleQuantityChange(ticket.id.toString(), parseInt(e.target.value, 10) || 0)
                }
                min="0"
                max={ticket.remainingQuantity ?? 0}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  handleQuantityChange(ticket.id.toString(), (selection[ticket.id] || 0) + 1)
                }
                disabled={(ticket.remainingQuantity ?? 0) <= (selection[ticket.id] || 0)}
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
