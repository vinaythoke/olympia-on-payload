import { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'createdBy', 'createdAt'],
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*'],
  },
  access: {
    create: ({ req: { user } }) => {
      // Only authenticated users can upload files
      return !!user
    },
    read: async ({ req: { user, payload } }) => {
      if (!user) return false

      // Superadmins can see all files
      if (user.role === 'superadmin') return true

      // Get files the user uploaded themselves
      const userUploadedFiles = {
        'createdBy.id': {
          equals: user.id,
        },
      }

      // For organizers, also get files referenced in their organizer profile
      if (user.role === 'organizer') {
        try {
          const organizerProfile = await payload.find({
            collection: 'organizers',
            where: {
              'user.id': {
                equals: user.id,
              },
            },
            depth: 0,
            limit: 1,
          })

          if (organizerProfile.docs.length > 0) {
            const organizer = organizerProfile.docs[0]
            if (organizer.logo) {
              // Allow access to the logo file even if they didn't upload it
              return {
                or: [
                  userUploadedFiles,
                  {
                    id: {
                      equals: organizer.logo,
                    },
                  },
                ],
              }
            }
          }
        } catch (error) {
          console.error('Error checking organizer logo access:', error)
        }
      }

      // For volunteers, also get files referenced in their volunteer profile
      if (user.role === 'volunteer') {
        try {
          const volunteerProfile = await payload.find({
            collection: 'volunteers',
            where: {
              'user.id': {
                equals: user.id,
              },
            },
            depth: 0,
            limit: 1,
          })

          if (volunteerProfile.docs.length > 0) {
            const volunteer = volunteerProfile.docs[0]
            if (volunteer.profilePicture) {
              // Allow access to the profile picture even if they didn't upload it
              return {
                or: [
                  userUploadedFiles,
                  {
                    id: {
                      equals: volunteer.profilePicture,
                    },
                  },
                ],
              }
            }
          }
        } catch (error) {
          console.error('Error checking volunteer profile picture access:', error)
        }
      }

      // Default: users can only see files they uploaded themselves
      return userUploadedFiles
    },
    update: ({ req: { user } }) => {
      if (!user) return false

      // Superadmins can update all files
      if (user.role === 'superadmin') return true

      // Other users can only update files they uploaded themselves
      return {
        'createdBy.id': {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false

      // Superadmins can delete all files
      if (user.role === 'superadmin') return true

      // Other users can only delete files they uploaded themselves
      return {
        'createdBy.id': {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
      defaultValue: ({ user }) => user?.id,
    },
  ],
}
