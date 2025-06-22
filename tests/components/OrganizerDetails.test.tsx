import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrganizerDetails } from '../../src/components/admin';

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('OrganizerDetails Component', () => {
  const mockOrganizer = {
    id: 'organizer-123',
    organizerName: 'Test Organizer',
    status: 'active',
    description: 'Test description',
    contactEmail: 'contact@test.com',
    contactPhone: '123-456-7890',
    website: 'https://test.com',
    address: {
      line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'Testland',
    },
    user: {
      id: 'user-456',
      name: 'Test User',
      email: 'user@test.com',
    },
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
  };

  it('should render organizer details correctly', () => {
    render(<OrganizerDetails organizer={mockOrganizer} />);
    
    // Check if key information is displayed
    expect(screen.getByText(mockOrganizer.organizerName)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.description)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.contactEmail)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.contactPhone)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.website)).toBeInTheDocument();
    
    // Check if address is displayed
    expect(screen.getByText(mockOrganizer.address.line1)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.address.city)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.address.state)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.address.postalCode)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.address.country)).toBeInTheDocument();
    
    // Check if user information is displayed
    expect(screen.getByText(mockOrganizer.user.name)).toBeInTheDocument();
    expect(screen.getByText(mockOrganizer.user.email)).toBeInTheDocument();
    
    // Check if status badge is displayed correctly
    const statusBadge = screen.getByText(mockOrganizer.status);
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge.className).toContain('bg-green'); // Active status should have green styling
  });

  it('should render inactive status with correct styling', () => {
    const inactiveOrganizer = {
      ...mockOrganizer,
      status: 'inactive',
    };
    
    render(<OrganizerDetails organizer={inactiveOrganizer} />);
    
    const statusBadge = screen.getByText('inactive');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge.className).toContain('bg-yellow'); // Inactive status should have yellow styling
  });

  it('should render suspended status with correct styling', () => {
    const suspendedOrganizer = {
      ...mockOrganizer,
      status: 'suspended',
    };
    
    render(<OrganizerDetails organizer={suspendedOrganizer} />);
    
    const statusBadge = screen.getByText('suspended');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge.className).toContain('bg-red'); // Suspended status should have red styling
  });

  it('should display edit button for superadmin users', () => {
    render(<OrganizerDetails organizer={mockOrganizer} isSuperAdmin={true} />);
    
    const editButton = screen.getByText('Edit');
    expect(editButton).toBeInTheDocument();
    expect(editButton.tagName).toBe('BUTTON');
  });

  it('should not display edit button for non-superadmin users', () => {
    render(<OrganizerDetails organizer={mockOrganizer} isSuperAdmin={false} />);
    
    const editButton = screen.queryByText('Edit');
    expect(editButton).not.toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalOrganizer = {
      id: 'organizer-123',
      organizerName: 'Test Organizer',
      status: 'active',
      user: {
        id: 'user-456',
        name: 'Test User',
        email: 'user@test.com',
      },
    };
    
    render(<OrganizerDetails organizer={minimalOrganizer} />);
    
    // Required fields should be displayed
    expect(screen.getByText(minimalOrganizer.organizerName)).toBeInTheDocument();
    expect(screen.getByText(minimalOrganizer.status)).toBeInTheDocument();
    
    // Optional fields should not cause errors
    expect(screen.queryByText('Description:')).not.toBeInTheDocument();
    expect(screen.queryByText('Contact Email:')).not.toBeInTheDocument();
    expect(screen.queryByText('Contact Phone:')).not.toBeInTheDocument();
    expect(screen.queryByText('Website:')).not.toBeInTheDocument();
    expect(screen.queryByText('Address:')).not.toBeInTheDocument();
  });
}); 