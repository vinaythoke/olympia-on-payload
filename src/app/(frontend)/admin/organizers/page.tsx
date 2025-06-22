'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { OrganizersList } from '@/components/admin';

export default function OrganizersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not a superadmin
  useEffect(() => {
    // Short delay to allow auth check
    const timer = setTimeout(() => {
      if (!user || user.role !== 'superadmin') {
        router.push('/login?error=unauthorized&redirect=/admin/organizers');
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
        <h1 className="text-3xl font-bold mb-8">Manage Organizers</h1>
        <OrganizersList />
      </div>
    );
  }

  // Otherwise, show nothing (will redirect)
  return null;
} 