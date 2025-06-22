import { CollectionConfig } from 'payload'
import { AuditAction } from '../lib/audit'

// Define the collection with proper typing
const Organizers: CollectionConfig = {
  slug: 'organizers',
  admin: {
    useAsTitle: 'organizerName',
    defaultColumns: ['organizerName', 'user.email', 'status'],
  },
  access: {
    create: ({ req: { user } }) => user?.role === 'superadmin',
    read: () => true,
    update: ({ req: { user }, id }) => {
      if (!user) {
        return false
      }
      if (user.role === 'superadmin') {
        return true
      }
      if (user.role === 'organizer') {
        // Allow organizers to update their own profile.
        // The query below ensures that the document's `user` field
        // matches the currently logged-in user's ID.
        return {
          'user.id': {
            equals: user.id,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }) => user?.role === 'superadmin',
  },
  hooks: {
    // Audit logging for organizer operations
    afterOperation: [
      async ({ operation, result, req }) => {
        // Skip if no result or no authenticated user
        if (!result || !req.user) return result

        // Import the audit log function dynamically to avoid circular dependencies
        const { createAuditLog } = await import('../lib/audit')

        // Map operation to audit action
        let action: AuditAction
        switch (operation) {
          case 'create':
            action = 'create'
            break
          case 'update':
            action = 'update'
            break
          case 'delete':
            action = 'delete'
            break
          default:
            return result // Skip for other operations
        }

        // Create audit log
        await createAuditLog({
          payload: req.payload,
          action,
          entityType: 'organizer',
          entityId: String(result.id),
          details: {
            organizerName: result.organizerName,
            status: result.status,
            updatedFields: operation === 'update' ? req.body : undefined,
          },
          userId: String(req.user.id),
        })

        return result
      },
    ],
  },
  fields: [
    {
      name: 'organizerName',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        condition: () => true, // Temporarily show in admin UI
      },
      filterOptions: {
        role: {
          equals: 'organizer',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Inactive',
          value: 'inactive',
        },
        {
          label: 'Suspended',
          value: 'suspended',
        },
      ],
      admin: {
        description: 'Set the organizer account status',
      },
      hooks: {
        beforeChange: [
          async ({ req, value, originalDoc }) => {
            // If status is changing, record it in the audit log
            if (originalDoc && originalDoc.status !== value && req.user) {
              const { createAuditLog } = await import('../lib/audit')

              await createAuditLog({
                payload: req.payload,
                action: 'status_change',
                entityType: 'organizer',
                entityId: String(originalDoc.id),
                details: {
                  previousStatus: originalDoc.status,
                  newStatus: value,
                },
                userId: String(req.user.id),
              })
            }

            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'contactEmail',
      type: 'email',
    },
    {
      name: 'contactPhone',
      type: 'text',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'address',
      type: 'group',
      fields: [
        {
          name: 'line1',
          type: 'text',
        },
        {
          name: 'line2',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'postalCode',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
        },
      ],
    },
  ],
}

export { Organizers }
