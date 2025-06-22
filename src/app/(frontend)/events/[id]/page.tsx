'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Event } from '@/payload-types'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EventDetailsPage() {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await fetch(`/api/events/${id}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch event details')
        }

        const data = await response.json()
        setEvent(data.event)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
        toast.error('Error loading event', { description: errorMessage })
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  const renderRichText = (description: any) => {
    if (!description || !description.root || !description.root.children) {
      return null;
    }
    
    return description.root.children.map((node: any, index: number) => {
      if (node.type === 'paragraph') {
        return <p key={index} className="mb-4">{node.children.map((child: any) => child.text).join('')}</p>;
      }
      // Add rendering for other node types like headings, lists etc. as needed
      return null;
    });
  };


  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading event details...</div>
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-500">Error: {error}</div>
  }

  if (!event) {
    return <div className="container mx-auto px-4 py-8 text-center">Event not found.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          {event.eventBanner && typeof event.eventBanner === 'object' && event.eventBanner.url && (
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <img src={event.eventBanner.url} alt={event.title} className="object-cover rounded-t-lg w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <CardTitle className="text-4xl font-bold">{event.title}</CardTitle>
            <Badge variant={event.status === 'published' ? 'default' : 'destructive'}>{event.status}</Badge>
          </div>
          {typeof event.organizer === 'object' && (
            <p className="text-lg text-muted-foreground">by {event.organizer.organizerName}</p>
          )}
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold mb-2">About this event</h3>
              <div className="prose max-w-none">
                {renderRichText(event.description)}
              </div>
            </div>
            <div>
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Date and time</h3>
                <p>{formatDate(event.eventDate)}</p>

                {event.location && (
                  <>
                    <h3 className="text-xl font-semibold mt-6 mb-2">Location</h3>
                    <p>{event.location.name}</p>
                    <p>{event.location.address}</p>
                    <p>{`${event.location.city}, ${event.location.state} ${event.location.postalCode}`}</p>
                  </>
                )}
                
                <Link href={`/events/${event.id}/register`} passHref className="w-full">
                  <Button size="lg" className="w-full mt-6">Register</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 