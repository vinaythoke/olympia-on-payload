# Organizer Management System Documentation

## Overview

The Organizer Management System is a core component of Project Olympia, designed to handle the creation, management, and monitoring of event organizers. This system enables superadmins to manage organizer accounts, track their status, and maintain audit logs of all changes for security and compliance purposes.

## Architecture

The system follows a layered architecture:

1. **Data Layer**: Payload CMS collections for Organizers, Users, and AuditLogs
2. **API Layer**: RESTful endpoints for CRUD operations and status management
3. **UI Layer**: Admin components for interacting with organizer data
4. **Security Layer**: Authentication, authorization, and audit logging

## Collections

### Organizers Collection

The `Organizers` collection stores information about event organizers, including:

- Basic details (name, description)
- Contact information (email, phone, website)
- Address information
- Status (active, inactive, suspended)
- Relationship to a User account

Key features:
- Role-based access controls
- Status management
- Audit logging for all operations

### AuditLogs Collection

The `AuditLogs` collection tracks all changes to organizer records, including:

- Action type (create, update, delete, status_change, access_attempt)
- Entity information (type, ID)
- User who performed the action
- Timestamp
- IP address and user agent
- Detailed change information

## API Endpoints

### Organizer Management Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/organizers/list` | GET | List all organizers with optional filtering | Superadmin |
| `/api/organizers/create` | POST | Create a new organizer account | Superadmin |
| `/api/organizers/[id]` | GET | Get details of a specific organizer | Superadmin, Own Organizer |
| `/api/organizers/[id]/update` | PATCH | Update organizer details | Superadmin |
| `/api/organizers/[id]/status` | PATCH | Change organizer status | Superadmin |

## Security Features

### Authentication and Authorization

- JWT-based authentication
- Role-based access controls:
  - Superadmins: Full access to all organizers
  - Organizers: Access only to their own information
  - Others: Limited access to public information

### Audit Logging

All operations on organizer records are logged with:
- User identification
- Timestamp
- IP address and user agent
- Detailed change information

### Rate Limiting

API endpoints are protected by rate limiting to prevent abuse:
- Maximum 5 requests per minute per IP address
- Configurable window and threshold

### Data Sanitization

Organizer data is sanitized based on user roles:
- Superadmins: Full access to all fields
- Organizers: Full access to own data, limited access to others
- Participants/Volunteers: Access only to public information

## UI Components

### Admin Components

| Component | Description |
|-----------|-------------|
| `OrganizersList` | Displays a paginated list of organizers with filtering options |
| `OrganizerDetails` | Shows detailed information about a specific organizer |
| `CreateOrganizerForm` | Form for creating new organizer accounts |
| `EditOrganizerForm` | Form for updating existing organizer details |

## Common Workflows

### Creating a New Organizer

1. Superadmin navigates to the organizer creation page
2. Fills in required information (name, email, password, organizer name)
3. Submits the form
4. System creates a new User with organizer role
5. System creates a linked Organizer record
6. System logs the creation action
7. Superadmin is redirected to the organizer list

### Changing Organizer Status

1. Superadmin navigates to organizer details page
2. Selects a new status from the dropdown (active, inactive, suspended)
3. Confirms the status change
4. System updates the organizer status
5. System logs the status change action
6. UI updates to reflect the new status

## Error Handling

The system implements comprehensive error handling:
- Input validation for all API requests
- Secure error messages that don't leak sensitive information
- Logging of all errors for troubleshooting
- Appropriate HTTP status codes for different error scenarios

## Best Practices

When extending or modifying the Organizer Management System:

1. Always maintain audit logging for all operations
2. Follow the established patterns for authentication and authorization
3. Sanitize data based on user roles
4. Use the middleware functions for consistent security checks
5. Update documentation when adding new features or workflows

## Troubleshooting

Common issues and solutions:

- **Access Denied Errors**: Verify user role and permissions
- **Rate Limiting Errors**: Check for excessive requests from the same IP
- **Missing Audit Logs**: Ensure hooks are properly configured in collections
- **Data Leakage**: Review data sanitization functions for the user role 