'use client'

import React from 'react'
import { TicketPurchaseList } from '@/components/tickets/TicketPurchaseList'

export default function MyTicketsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Tickets</h1>
      <TicketPurchaseList />
    </div>
  )
} 