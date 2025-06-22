'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { EditOrganizerForm } from '@/components/admin'

// Define props for the page component
type EditOrganizerPageProps = {
  params: Promise<{
    id: string
  }>
}

export default function EditOrganizerPage({ params }: EditOrganizerPageProps) {
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
        router.push(`/login?error=unauthorized&redirect=/admin/organizers/${id}/edit`)
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
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Edit Organizer</h1>
          <div className="flex space-x-2">
            <Link
              href={`/admin/organizers/${id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <Link
              href="/admin/organizers"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              Back to List
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <EditOrganizerForm organizerId={id} />
        </div>
      </div>
    )
  }

  // Otherwise, show nothing (will redirect)
  return null
}
