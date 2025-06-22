/**
 * OrganizersList Component
 * 
 * Displays a paginated list of organizers with filtering options.
 * Only accessible to superadmins.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrganizerStatus } from '../../lib/organizers/types';
import { formatOrganizerForList } from '../../lib/organizers/transforms';

// Status badge component for visual representation of organizer status
function StatusBadge({ status }: { status: string }) {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-800';
  
  if (status === 'active') {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
  } else if (status === 'inactive') {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
  } else if (status === 'suspended') {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/**
 * OrganizersList component props
 */
interface OrganizersListProps {
  initialOrganizers?: any[];
}

/**
 * OrganizersList component
 */
export default function OrganizersList({ initialOrganizers = [] }: OrganizersListProps) {
  const router = useRouter();
  
  // State management
  const [organizers, setOrganizers] = useState<any[]>(initialOrganizers);
  const [loading, setLoading] = useState<boolean>(initialOrganizers.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrganizerStatus | 'all'>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Fetch organizers with optional filtering
  const fetchOrganizers = async (page: number = 1, status: OrganizerStatus | 'all' = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      // Construct query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      
      if (status !== 'all') {
        params.append('status', status);
      }
      
      // Fetch data from API
      const response = await fetch(`/api/organizers/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        // Handle unauthorized access
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }
        
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Format organizer data for display
      const formattedOrganizers = data.organizers.map(formatOrganizerForList);
      
      setOrganizers(formattedOrganizers);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch organizers:', err);
      setError('Failed to load organizers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch organizers when filters change
  useEffect(() => {
    fetchOrganizers(page, statusFilter);
  }, [page, statusFilter]);
  
  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as OrganizerStatus | 'all';
    setStatusFilter(value);
    setPage(1); // Reset to first page when filter changes
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Organizers</h2>
        
        <div className="flex space-x-4">
          {/* Status filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          {/* Create new organizer button */}
          <div className="flex items-end">
            <Link 
              href="/admin/organizers/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Organizer
            </Link>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Organizers table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organizer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {organizers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No organizers found
                    </td>
                  </tr>
                ) : (
                  organizers.map((organizer) => (
                    <tr key={organizer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{organizer.organizerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{organizer.userName}</div>
                        <div className="text-sm text-gray-500">{organizer.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{organizer.contactEmail || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={organizer.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link 
                          href={`/admin/organizers/${organizer.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </Link>
                        <Link 
                          href={`/admin/organizers/${organizer.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.414l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pageNum === page
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 