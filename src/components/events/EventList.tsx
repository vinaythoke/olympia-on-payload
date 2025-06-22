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
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Event } from '@/payload-types'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function EventList() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/events/list?status=published&limit=100`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch events')
        }

        const data = await response.json()
        setEvents(data.docs || [])
        setFilteredEvents(data.docs || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error('Failed to load events', {
          description: errorMessage,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    let results = events.filter((event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    if (selectedCategory !== 'all') {
      results = results.filter((event) => event.category === selectedCategory)
    }
    setFilteredEvents(results)
  }, [searchTerm, selectedCategory, events])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading events...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 my-4">
        <p>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Discover Events</h1>
        <p className="text-muted-foreground">Browse through our upcoming events.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search for an event..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="arts">Arts</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No events found</h2>
          <p className="text-muted-foreground mt-2">
            There are no events matching your search term. Try a different search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                {typeof event.organizer === 'object' && event.organizer?.organizerName && (
                  <Badge variant="outline" className="w-fit mb-2">
                    {event.organizer.organizerName}
                  </Badge>
                )}
                <CardTitle>{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="aspect-video bg-muted rounded-md mb-4">
                  {event.eventBanner &&
                    typeof event.eventBanner === 'object' &&
                    event.eventBanner.url && (
                      <img
                        src={event.eventBanner.url}
                        alt={event.title}
                        className="object-cover w-full h-full rounded-md"
                      />
                    )}
                </div>
                <div className="text-sm text-muted-foreground">{formatDate(event.eventDate)}</div>
                {event.location?.city && event.location?.country && (
                  <p className="text-sm text-muted-foreground mt-1">{`${event.location.city}, ${event.location.country}`}</p>
                )}
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event.id}`} passHref className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
