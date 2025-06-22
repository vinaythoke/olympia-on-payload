import { CollectionConfig } from 'payload'
import { type User } from 'payload'

const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'organizer.organizerName', 'status', 'eventDate'],
  },
  access: {
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'superadmin' || user.role === 'organizer'
    },
    read: async ({ req: { user, payload } }) => {
      // Published events are public
      const publishedEventsQuery = {
        status: {
          equals: 'published',
        },
      }

      if (!user) {
        return publishedEventsQuery
      }

      // Superadmins can see everything
      if (user.role === 'superadmin') {
        return true
      }

      // Organizers can see published events and their own drafts/cancelled events
      if (user.role === 'organizer') {
        const userOrganizer = await getOrganizerForUser(user, payload)
        if (!userOrganizer) {
          return publishedEventsQuery // No organizer profile, can only see public events
        }

        return {
          or: [
            publishedEventsQuery,
            {
              organizer: {
                equals: userOrganizer.id,
              },
            },
          ],
        }
      }

      // Other authenticated users (e.g., participants) can only see published events
      return publishedEventsQuery
    },
    update: async ({ req: { user, payload }, id }) => {
      if (!user) return false
      if (user.role === 'superadmin') return true
      if (user.role === 'organizer') {
        const userOrganizer = await getOrganizerForUser(user, payload)
        if (!userOrganizer) return false

        return {
          organizer: {
            equals: userOrganizer.id,
          },
        }
      }
      return false
    },
    delete: async ({ req: { user, payload }, id }) => {
      if (!user) return false
      if (user.role === 'superadmin') return true
      if (user.role === 'organizer') {
        const userOrganizer = await getOrganizerForUser(user, payload)
        if (!userOrganizer) return false

        return {
          organizer: {
            equals: userOrganizer.id,
          },
        }
      }
      return false
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'organizers',
      required: true,
    },
    {
      name: 'eventBanner',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Music', value: 'music' },
        { label: 'Sports', value: 'sports' },
        { label: 'Arts', value: 'arts' },
        { label: 'Conference', value: 'conference' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'eventDate',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'address',
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
          name: 'country',
          type: 'text',
        },
        {
          name: 'postalCode',
          type: 'text',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'capacity',
      type: 'number',
    },
    {
      name: 'registrationForm',
      type: 'relationship',
      relationTo: 'form-builders',
      admin: {
        description: 'Select a form for event registration',
      },
    },
    {
      name: 'ticketing',
      type: 'group',
      admin: {
        description: 'Ticketing settings for this event',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Enable ticketing for this event',
        },
        {
          name: 'requiresTicket',
          type: 'checkbox',
          defaultValue: true,
          label: 'Attendance requires a ticket',
          admin: {
            condition: (data) => data?.enabled === true,
          },
        },
        {
          name: 'maxTicketsPerPerson',
          type: 'number',
          min: 1,
          defaultValue: 5,
          admin: {
            description: 'Maximum number of tickets a single person can purchase',
            condition: (data) => data?.enabled === true,
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ req, operation, doc }) => {
        // If a form is assigned to this event, update the form to link back to this event
        if (operation === 'create' || operation === 'update') {
          if (doc.registrationForm) {
            try {
              await req.payload.update({
                collection: 'form-builders',
                id: doc.registrationForm,
                data: {
                  event: doc.id,
                },
              })
            } catch (error) {
              console.error("Error updating form's event link:", error)
            }
          }
        }
      },
    ],
  },
}

// Helper to get the organizer profile for a given user
const getOrganizerForUser = async (user: User, payload: any) => {
  if (!user || user.role !== 'organizer') return null

  try {
    const organizerQuery = await payload.find({
      collection: 'organizers',
      where: {
        'user.id': {
          equals: user.id,
        },
      },
      depth: 0,
      limit: 1,
    })
    return organizerQuery.docs[0] || null
  } catch (error) {
    console.error('Error fetching organizer for user:', error)
    return null
  }
}

export { Events }
