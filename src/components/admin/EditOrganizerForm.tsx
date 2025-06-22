'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

type OrganizerData = {
  id: string;
  organizerName: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  logo?: {
    id: string;
    url: string;
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
};

type EditOrganizerFormProps = {
  organizerId: string;
};

export function EditOrganizerForm({ organizerId }: EditOrganizerFormProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields
  const [organizerName, setOrganizerName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  
  // Address fields
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  
  // User info (readonly)
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Fetch the organizer data
  useEffect(() => {
    const fetchOrganizerData = async () => {
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
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch organizer data');
        }

        const organizer: OrganizerData = await response.json();
        
        // Populate form fields with existing data
        setOrganizerName(organizer.organizerName || '');
        setDescription(organizer.description || '');
        setStatus(organizer.status || 'active');
        setContactEmail(organizer.contactEmail || '');
        setContactPhone(organizer.contactPhone || '');
        setWebsite(organizer.website || '');
        
        // Set address fields if available
        if (organizer.address) {
          setLine1(organizer.address.line1 || '');
          setLine2(organizer.address.line2 || '');
          setCity(organizer.address.city || '');
          setState(organizer.address.state || '');
          setPostalCode(organizer.address.postalCode || '');
          setCountry(organizer.address.country || '');
        }
        
        // Set user info
        if (organizer.user) {
          setUserName(organizer.user.name || '');
          setUserEmail(organizer.user.email || '');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching organizer data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setIsLoading(false);
      }
    };

    fetchOrganizerData();
  }, [organizerId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!token) {
        throw new Error('You must be logged in as a Superadmin to update organizer accounts');
      }

      const response = await fetch(`/api/organizers/${organizerId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          organizerName,
          description,
          status,
          contactEmail,
          contactPhone,
          website,
          address: {
            line1,
            line2,
            city,
            state,
            postalCode,
            country,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update organizer account');
      }

      // Show success message
      setSuccess('Organizer account updated successfully');
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push(`/admin/organizers/${organizerId}`);
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Edit Organizer Account</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">User Account (Read-only)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Name
              </label>
              <input
                type="text"
                value={userName}
                disabled
                className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                To change user account details, please use the User Management section.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Organizer Details</h3>
            
            <div>
              <label htmlFor="organizerName" className="block text-sm font-medium text-gray-700 mb-1">
                Organizer Name *
              </label>
              <input
                id="organizerName"
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'suspended')}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {status === 'inactive' && 'Inactive organizers cannot log in'}
                {status === 'suspended' && 'Suspended organizers are blocked from accessing any platform features'}
                {status === 'active' && 'Active organizers have full access to their account features'}
              </p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
            
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Address</h3>
            
            <div>
              <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <input
                id="line1"
                type="text"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                id="line2"
                type="text"
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  id="state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => router.push(`/admin/organizers/${organizerId}`)}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 