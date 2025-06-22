import { CollectionConfig, type User } from 'payload'
import { encrypt, decrypt } from '../lib/encryption'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
    tokenExpiration: 7200,
    forgotPassword: {
      generateEmailHTML: (args) => {
        const token = args?.token
        return `
          <h1>Reset Your Password</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}">Reset Password</a>
        `
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    group: 'User Management',
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (!user) {
        return false
      }
      if (user.role === 'superadmin') {
        return true
      }
      return {
        id: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user, payload }, id }) => {
      // Allow public access for forgot password
      if (payload.config.email && id) {
        return true
      }
      if (!user) {
        return false
      }
      if (user.role === 'superadmin') {
        return true
      }
      if (user.id === id) {
        return true
      }
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) {
        return false
      }
      return user.role === 'superadmin'
    },
    admin: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'superadmin' || user.role === 'organizer'
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, operation, originalDoc, data }) => {
        if (operation === 'update' && originalDoc) {
          if (data.role && data.role !== originalDoc.role) {
            if (req.user && req.user.role !== 'superadmin') {
              data.role = originalDoc.role
            }
          }
        }
        return data
      },
    ],
    afterDelete: [],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Superadmin', value: 'superadmin' },
        { label: 'Organizer', value: 'organizer' },
        { label: 'Participant', value: 'participant' },
        { label: 'Volunteer', value: 'volunteer' },
      ],
      required: true,
      defaultValue: 'participant',
      admin: {
        condition: (data, siblingData, { user }) => user?.role === 'superadmin',
      },
    },
    {
      name: 'verification',
      type: 'group',
      fields: [
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Not Verified', value: 'not_verified' },
            { label: 'Pending', value: 'pending' },
            { label: 'Verified', value: 'verified' },
            { label: 'Rejected', value: 'rejected' },
          ],
          defaultValue: 'not_verified',
        },
        {
          name: 'aadhaar',
          type: 'text',
          admin: {
            condition: (data) => data?.verification?.status === 'verified',
          },
        },
        {
          name: 'pan',
          type: 'text',
          admin: {
            condition: (data) => data?.verification?.status === 'verified',
          },
        },
        {
          name: 'verifiedData',
          type: 'json',
          admin: {
            condition: (data) => data?.verification?.status === 'verified',
          },
        },
      ],
    },
    {
      name: 'profileComplete',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'contactDetails',
      type: 'group',
      fields: [
        {
          name: 'phone',
          type: 'text',
          admin: {
            description: 'Format: +91XXXXXXXXXX',
          },
        },
        {
          name: 'address',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'personalInfo',
      type: 'text',
      admin: {
        description:
          'Sensitive personal information (e.g., address, phone number). This field is encrypted in the database.',
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (value) {
              return encrypt(value)
            }
          },
        ],
        afterRead: [
          ({ value }) => {
            if (value) {
              return decrypt(value)
            }
          },
        ],
      },
    },
  ],
}

export { Users }
