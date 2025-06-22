import { CollectionConfig } from 'payload'

const Volunteers: CollectionConfig = {
  slug: 'volunteers',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'status', 'managedBy'],
  },
  access: {
    // Only organizers can create volunteers
    create: ({ req }) => {
      return Boolean(req.user?.role === 'organizer')
    },
    // Superadmins can read all volunteers
    // Organizers can read only their volunteers
    // Volunteers can read only themselves
    read: ({ req }) => {
      if (req.user?.role === 'superadmin') return true

      if (req.user?.role === 'organizer') {
        return {
          managedBy: {
            equals: req.user.id,
          },
        }
      }

      if (req.user?.role === 'volunteer') {
        return {
          user: {
            equals: req.user.id,
          },
        }
      }

      return false
    },
    // Organizers can update their volunteers
    // Superadmins can update any volunteer
    update: ({ req }) => {
      if (req.user?.role === 'superadmin') return true

      if (req.user?.role === 'organizer') {
        return {
          managedBy: {
            equals: req.user.id,
          },
        }
      }

      return false
    },
    // Only the managing organizer or superadmin can delete volunteers
    delete: ({ req }) => {
      if (req.user?.role === 'superadmin') return true

      if (req.user?.role === 'organizer') {
        return {
          managedBy: {
            equals: req.user.id,
          },
        }
      }

      return false
    },
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture for the volunteer (may be shown at events)',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      filterOptions: {
        role: {
          equals: 'volunteer',
        },
      },
    },
    {
      name: 'managedBy',
      type: 'relationship',
      relationTo: 'organizers',
      required: true,
    },
    {
      name: 'assignedEvents',
      type: 'relationship',
      relationTo: 'events',
      hasMany: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      defaultValue: 'active',
    },
    {
      name: 'checkInStats',
      type: 'group',
      fields: [
        {
          name: 'totalCheckins',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'lastCheckIn',
          type: 'date',
        },
      ],
    },
  ],
}

export { Volunteers }
