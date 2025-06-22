'use client';

import { CheckInInterface } from '@/components/check-in/CheckInInterface';
import { Navbar } from '@/components/layout';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CheckInPage() {
  const { isAuthenticated, hasRole, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/check-in');
    } else if (user && !hasRole(['superadmin', 'organizer', 'volunteer'])) {
      router.push('/'); // Redirect to home if not an authorized role
    }
  }, [isAuthenticated, user, hasRole, router]);
  
  // Render a loading state or null while checking auth
  if (!isAuthenticated || !user || !hasRole(['superadmin', 'organizer', 'volunteer'])) {
    return (
        <>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <p className="text-center">Loading or Access Denied...</p>
            </main>
        </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <CheckInInterface />
      </main>
    </div>
  );
} 