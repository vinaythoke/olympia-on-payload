'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { OrganizerDetails } from '@/components/admin'

// Define props for the page component
type OrganizerPageProps = {
  params: Promise<{
    id: string
  }>
}

export default function OrganizerPage({ params }: OrganizerPageProps) {
  const [id, setId] = useState<string>('')
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  // Handle async params
  useEffect(() => {
    params.then(({ id: organizerId }) => {
      setId(organizerId)
    })
  }, [params])

  // Redirect if not a superadmin
  useEffect(() => {
    if (!id) return // Wait for params to resolve

    // Short delay to allow auth check
    const timer = setTimeout(() => {
      if (!user || user.role !== 'superadmin') {
        router.push(`/login?error=unauthorized&redirect=/admin/organizers/${id}`)
      }
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [user, router, id])

  if (isLoading || !id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If we're still here and have a superadmin user, show the content
  if (user && user.role === 'superadmin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Organizer Details</h1>
        <OrganizerDetails organizerId={id} />
      </div>
    )
  }

  // Otherwise, show nothing (will redirect)
  return null
}
