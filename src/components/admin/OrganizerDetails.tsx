'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';

type OrganizerDetails = {
  id: string;
  organizerName: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  logo?: {
    url: string;
    alt: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type OrganizerDetailsProps = {
  organizerId: string;
};

export function OrganizerDetails({ organizerId }: OrganizerDetailsProps) {
  const { token } = useAuth();
  const [organizer, setOrganizer] = useState<OrganizerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Fetch organizer details
  useEffect(() => {
    const fetchOrganizerDetails = async () => {
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/organizers/${organizerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to fetch organizer details');
        }

        const data = await response.json();
        setOrganizer(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching organizer details:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setIsLoading(false);
      }
    };

    fetchOrganizerDetails();
  }, [organizerId, token]);

  // Update organizer status
  const updateStatus = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (!token || !organizer) return;
    
    setIsStatusChanging(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/organizers/${organizerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update organizer status');
      }

      // Update the local organizer state with new status
      setOrganizer({ ...organizer, status: newStatus });
      setStatusMessage({ type: 'success', text: 'Status updated successfully' });
      
      // Close the dropdown
      setShowStatusDropdown(false);
    } catch (err) {
      console.error('Error updating organizer status:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'An unexpected error occurred'
      });
    } finally {
      setIsStatusChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Error: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No organizer found with ID: {organizerId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format address if available
  const formatAddress = () => {
    if (!organizer.address) return 'No address provided';
    
    const parts = [
      organizer.address.line1,
      organizer.address.line2,
      organizer.address.city,
      organizer.address.state,
      organizer.address.postalCode,
      organizer.address.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  };
  
  // Get status label and color
  const getStatusBadge = () => {
    switch (organizer.status) {
      case 'active':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
      case 'suspended':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Suspended</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {statusMessage && (
        <div className={`p-4 ${statusMessage.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'} border-l-4`}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">{statusMessage.text}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Organizer Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Complete information about this organizer.
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={isStatusChanging}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {isStatusChanging ? 'Updating...' : 'Change Status'}
              <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showStatusDropdown && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1 divide-y divide-gray-100" role="menu" aria-orientation="vertical" aria-labelledby="status-options">
                  <button
                    onClick={() => updateStatus('active')}
                    disabled={organizer.status === 'active'}
                    className={`block px-4 py-2 text-sm w-full text-left ${organizer.status === 'active' ? 'bg-gray-100 text-gray-500 cursor-default' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => updateStatus('inactive')}
                    disabled={organizer.status === 'inactive'}
                    className={`block px-4 py-2 text-sm w-full text-left ${organizer.status === 'inactive' ? 'bg-gray-100 text-gray-500 cursor-default' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => updateStatus('suspended')}
                    disabled={organizer.status === 'suspended'}
                    className={`block px-4 py-2 text-sm w-full text-left ${organizer.status === 'suspended' ? 'bg-gray-100 text-gray-500 cursor-default' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    Suspend
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <Link
            href={`/admin/organizers/${organizerId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit
          </Link>
          <Link
            href="/admin/organizers"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
          >
            Back to List
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {getStatusBadge()}
            </dd>
          </div>
          
          {organizer.logo && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Logo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="h-20 w-20 relative">
                  <Image
                    src={organizer.logo.url}
                    alt={organizer.logo.alt || organizer.organizerName}
                    fill
                    className="object-contain"
                  />
                </div>
              </dd>
            </div>
          )}
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Organizer name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {organizer.organizerName}
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {organizer.description || 'No description provided'}
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Associated user</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div>{organizer.user.name}</div>
              <div className="text-gray-500">{organizer.user.email}</div>
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Contact email</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <a href={`mailto:${organizer.contactEmail}`} className="text-blue-600 hover:underline">
                {organizer.contactEmail || 'No contact email provided'}
              </a>
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Contact phone</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {organizer.contactPhone || 'No phone number provided'}
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Website</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {organizer.website ? (
                <a 
                  href={organizer.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {organizer.website}
                </a>
              ) : (
                'No website provided'
              )}
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Address</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatAddress()}
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(organizer.createdAt)}
            </dd>
          </div>

          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Last updated</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(organizer.updatedAt)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
} 