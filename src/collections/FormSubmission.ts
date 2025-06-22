import { CollectionConfig } from 'payload'

const FormSubmission: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'submissionID',
    defaultColumns: ['submissionID', 'form.name', 'createdAt', 'status'],
    group: 'Form Management',
  },
  access: {
    // Regular users can create submissions
    create: () => true,

    // Only form owners and superadmins can read submissions
    read: async ({ req }) => {
      if (!req.user) return false

      if (req.user.role === 'superadmin') return true

      if (req.user.role === 'organizer') {
        // Organizers can see all submissions for now
        // TODO: Implement proper filtering based on event ownership
        return true
      }

      // Participants can only view their own submissions
      if (req.user.role === 'participant') {
        return {
          'submittedBy.id': {
            equals: req.user.id || '',
          },
        }
      }

      return false
    },

    // Only form owners and superadmins can update submissions
    update: async ({ req }) => {
      if (!req.user) return false

      if (req.user.role === 'superadmin') return true

      if (req.user.role === 'organizer') {
        // Organizers can update submissions for now
        // TODO: Implement proper filtering based on event ownership
        return true
      }

      return false
    },

    // Only superadmins can delete submissions
    delete: ({ req }) => {
      return req.user?.role === 'superadmin'
    },
  },
  fields: [
    {
      name: 'submissionID',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'form-builders',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'formData',
      type: 'json',
      required: true,
      admin: {
        description: 'JSON data containing all form field responses',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'submitted',
      required: true,
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this submission (not visible to participant)',
        condition: (data, siblingData, { user }) => {
          return ['organizer', 'superadmin'].includes(user?.role)
        },
      },
    },
    {
      name: 'files',
      type: 'array',
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'fieldId',
          type: 'text',
          required: true,
          admin: {
            description: 'The field ID this file corresponds to',
          },
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
      admin: {
        description: 'Files uploaded as part of this form submission',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data, siblingData, { user }) => {
          return ['organizer', 'superadmin'].includes(user?.role)
        },
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
        condition: (data, siblingData, { user }) => {
          return ['organizer', 'superadmin'].includes(user?.role)
        },
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        // Generate a unique submission ID on creation
        if (operation === 'create') {
          data.submissionID = `SUB-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000)}`

          // Record IP and user agent for audit purposes
          if (req) {
            const forwardedFor = req.headers.get('x-forwarded-for')
            const remoteAddr = req.headers.get('x-real-ip')
            data.ipAddress = forwardedFor || remoteAddr || 'unknown'
            data.userAgent = req.headers.get('user-agent') || 'unknown'
          }

          // Link to event if form is associated with an event
          if (data.form) {
            try {
              const form = await req.payload.findByID({
                collection: 'form-builders',
                id: String(data.form),
              })

              if (form && form.event) {
                data.event = form.event
              }
            } catch (error) {
              console.error('Error resolving form event:', error)
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ req, doc, operation }) => {
        // Add this submission to the form's responses array
        if (operation === 'create' && doc.form) {
          try {
            await req.payload.update({
              collection: 'form-builders',
              id: String(doc.form),
              data: {
                formResponses: [...(doc.formResponses || []), doc.id],
              },
            })
          } catch (error) {
            console.error('Error updating form responses:', error)
          }
        }
      },
    ],
  },
}

export { FormSubmission }
