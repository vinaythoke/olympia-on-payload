import { CollectionConfig } from 'payload'

const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'entityType', 'entityId', 'createdBy', 'createdAt'],
    group: 'System',
  },
  access: {
    // Only superadmins can read audit logs
    read: ({ req }) => {
      return Boolean(req.user?.role === 'superadmin');
    },
    // No one can update or delete audit logs - they are immutable
    update: () => false,
    delete: () => false,
    // Creation is handled internally by hooks
    create: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
        { label: 'Status Change', value: 'status_change' },
        { label: 'Access Attempt', value: 'access_attempt' },
      ],
    },
    {
      name: 'entityType',
      type: 'select',
      required: true,
      options: [
        { label: 'Organizer', value: 'organizer' },
        { label: 'User', value: 'user' },
        { label: 'Event', value: 'event' },
        { label: 'Ticket', value: 'ticket' },
        { label: 'Volunteer', value: 'volunteer' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'entityId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'details',
      type: 'json',
      admin: {
        description: 'Details of the changes made',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address of the user who made the change',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User agent of the browser/client used',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who performed this action',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}

export { AuditLogs } 