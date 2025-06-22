'use client'

import React from 'react'
import { RegistrationForm } from '@/components/events/RegistrationForm'
import { useParams } from 'next/navigation'

export default function RegisterPage() {
  const params = useParams()
  const eventId = params.id as string

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Register for Event</h1>
        <p className="text-muted-foreground mb-8">
          Complete the steps below to secure your spot.
        </p>
        
        {eventId ? (
          <RegistrationForm eventId={eventId} />
        ) : (
          <div>Loading event details...</div>
        )}
      </div>
    </div>
  )
} 