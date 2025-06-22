'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { CreateOrganizerForm } from '@/components/admin';

export default function CreateOrganizerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not a superadmin
  useEffect(() => {
    // Short delay to allow auth check
    const timer = setTimeout(() => {
      if (!user || user.role !== 'superadmin') {
        router.push('/login?error=unauthorized&redirect=/admin/organizers/create');
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we're still here and have a superadmin user, show the content
  if (user && user.role === 'superadmin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create Organizer Account</h1>
          <Link 
            href="/admin/organizers" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Organizers
          </Link>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <CreateOrganizerForm />
        </div>
      </div>
    );
  }

  // Otherwise, show nothing (will redirect)
  return null;
} 