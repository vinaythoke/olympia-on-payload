import { CollectionConfig, Access } from 'payload'

const Tickets: CollectionConfig = {
  slug: 'tickets',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'event.title', 'type', 'price', 'quantity'],
  },
  access: {
    // Only organizers and superadmins can create tickets
    create: ({ req }) => {
      return Boolean(req.user && ['organizer', 'superadmin'].includes(req.user?.role as string));
    },
    // Published tickets can be read by anyone
    // Draft tickets can be read by the creating organizer and superadmins
    read: async ({ req, id }) => {
      // If no user and no specific ID, only return public tickets for published events
      if (!req.user && !id) {
        return {
          visibility: {
            equals: 'public',
          },
        };
      }
      
      // If no user but specific ID, check if the ticket is public and the event is published
      if (!req.user && id) {
        try {
          const ticket = await req.payload.findByID({
            collection: 'tickets',
            id,
          });
          
          if (ticket && ticket.visibility === 'public') {
            const event = await req.payload.findByID({
              collection: 'events',
              id: ticket.event,
            });
            
            return event && event.status === 'published';
          }
          
          return false;
        } catch (error) {
          return false;
        }
      }
      
      // Superadmins can read all tickets
      if (req.user?.role === 'superadmin') return true;
      
      // Organizers can read tickets for their events
      if (req.user?.role === 'organizer') {
        if (id) {
          try {
            const ticket = await req.payload.findByID({
              collection: 'tickets',
              id,
            });
            
            if (ticket) {
              const event = await req.payload.findByID({
                collection: 'events',
                id: ticket.event,
              });
              
              if (event && event.organizer) {
                // Check if the organizer is associated with this event
                const organizerId = typeof event.organizer === 'object' ? event.organizer.id : event.organizer;
                const organizer = await req.payload.findByID({
                  collection: 'organizers',
                  id: organizerId,
                });
                
                if (organizer && organizer.user) {
                  const userId = typeof organizer.user === 'object' ? organizer.user.id : organizer.user;
                  return userId === req.user.id;
                }
              }
            }
          } catch (error) {
            return false;
          }
        } else {
          // For list views, we'll return all and filter in afterRead
          return true;
        }
      }
      
      // Default deny
      return false;
    },
    // Only the creating organizer or superadmin can update tickets
    update: async ({ req, id }) => {
      if (!req.user || !id) return false;
      
      // Superadmins can update all tickets
      if (req.user.role === 'superadmin') return true;
      
      // Organizers can update tickets for their events
      if (req.user.role === 'organizer') {
        try {
          const ticket = await req.payload.findByID({
            collection: 'tickets',
            id,
          });
          
          if (ticket) {
            const event = await req.payload.findByID({
              collection: 'events',
              id: ticket.event,
            });
            
            if (event && event.organizer) {
              // Check if the organizer is associated with this event
              const organizerId = typeof event.organizer === 'object' ? event.organizer.id : event.organizer;
              const organizer = await req.payload.findByID({
                collection: 'organizers',
                id: organizerId,
              });
              
              if (organizer && organizer.user) {
                const userId = typeof organizer.user === 'object' ? organizer.user.id : organizer.user;
                return userId === req.user.id;
              }
            }
          }
        } catch (error) {
          return false;
        }
      }
      
      return false;
    },
    // Only the creating organizer or superadmin can delete tickets
    delete: async ({ req, id }) => {
      if (!req.user || !id) return false;
      
      // Superadmins can delete all tickets
      if (req.user.role === 'superadmin') return true;
      
      // Organizers can delete tickets for their events
      if (req.user.role === 'organizer') {
        try {
          const ticket = await req.payload.findByID({
            collection: 'tickets',
            id,
          });
          
          if (ticket) {
            const event = await req.payload.findByID({
              collection: 'events',
              id: ticket.event,
            });
            
            if (event && event.organizer) {
              // Check if the organizer is associated with this event
              const organizerId = typeof event.organizer === 'object' ? event.organizer.id : event.organizer;
              const organizer = await req.payload.findByID({
                collection: 'organizers',
                id: organizerId,
              });
              
              if (organizer && organizer.user) {
                const userId = typeof organizer.user === 'object' ? organizer.user.id : organizer.user;
                return userId === req.user.id;
              }
            }
          }
        } catch (error) {
          return false;
        }
      }
      
      return false;
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Paid', value: 'paid' },
        { label: 'RSVP', value: 'rsvp' },
        { label: 'Protected', value: 'protected' },
      ],
      required: true,
      defaultValue: 'free',
    },
    {
      name: 'price',
      type: 'number',
      min: 0,
      admin: {
        condition: (data) => data.type === 'paid',
      },
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'USD ($)', value: 'USD' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' },
      ],
      defaultValue: 'USD',
      admin: {
        condition: (data) => data.type === 'paid',
      },
    },
    {
      name: 'quantity',
      type: 'number',
      min: 0,
      required: true,
      defaultValue: 100,
    },
    {
      name: 'remainingQuantity',
      type: 'number',
      min: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'visibility',
      type: 'select',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Private', value: 'private' },
      ],
      defaultValue: 'public',
      required: true,
    },
    {
      name: 'protectionDetails',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'protected',
      },
      fields: [
        {
          name: 'protectionType',
          type: 'select',
          options: [
            { label: 'Password', value: 'password' },
            { label: 'PIN', value: 'pin' },
            { label: 'Access Code', value: 'code' },
          ],
          defaultValue: 'password',
        },
        {
          name: 'password',
          type: 'text',
          admin: {
            condition: (data) => data?.protectionType === 'password',
          },
        },
        {
          name: 'pin',
          type: 'text',
          admin: {
            condition: (data) => data?.protectionType === 'pin',
          },
        },
        {
          name: 'accessCode',
          type: 'text',
          admin: {
            condition: (data) => data?.protectionType === 'code',
          },
        },
      ],
    },
    {
      name: 'visibilityRules',
      type: 'group',
      admin: {
        description: 'Define who can see this ticket based on demographics',
      },
      fields: [
        {
          name: 'enableRules',
          type: 'checkbox',
          defaultValue: false,
          label: 'Enable visibility rules',
        },
        {
          name: 'ageRange',
          type: 'group',
          admin: {
            condition: (data) => data?.enableRules === true,
          },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Filter by age',
            },
            {
              name: 'minAge',
              type: 'number',
              min: 0,
              admin: {
                condition: (data) => data?.enabled === true,
              },
            },
            {
              name: 'maxAge',
              type: 'number',
              min: 0,
              admin: {
                condition: (data) => data?.enabled === true,
              },
            },
          ],
        },
        {
          name: 'gender',
          type: 'group',
          admin: {
            condition: (data) => data?.enableRules === true,
          },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Filter by gender',
            },
            {
              name: 'allowedGenders',
              type: 'select',
              hasMany: true,
              admin: {
                condition: (data) => data?.enabled === true,
              },
              options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Non-binary', value: 'nonbinary' },
                { label: 'Other', value: 'other' },
              ],
            },
          ],
        },
        {
          name: 'location',
          type: 'group',
          admin: {
            condition: (data) => data?.enableRules === true,
          },
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Filter by location',
            },
            {
              name: 'countries',
              type: 'array',
              admin: {
                condition: (data) => data?.enabled === true,
              },
              fields: [
                {
                  name: 'country',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'customFormFields',
      type: 'relationship',
      relationTo: 'form-builders',
      admin: {
        description: 'Additional form fields specific to this ticket',
      },
    },
    {
      name: 'saleStartDate',
      type: 'date',
    },
    {
      name: 'saleEndDate',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Sold Out', value: 'sold-out' },
      ],
      defaultValue: 'active',
      required: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Set initial remaining quantity to match total quantity on create
        if (operation === 'create') {
          data.remainingQuantity = data.quantity;
        }
        return data;
      },
    ],
    afterRead: [
      async ({ req, doc }) => {
        // For organizers, we need to check if they have access to this ticket
        if (req.user?.role === 'organizer') {
          try {
            const event = await req.payload.findByID({
              collection: 'events',
              id: doc.event,
            });
            
            if (event && event.organizer) {
              // Check if the organizer is associated with this event
              const organizerId = typeof event.organizer === 'object' ? event.organizer.id : event.organizer;
              const organizer = await req.payload.findByID({
                collection: 'organizers',
                id: organizerId,
              });
              
              if (organizer && organizer.user) {
                const userId = typeof organizer.user === 'object' ? organizer.user.id : organizer.user;
                if (userId !== req.user.id) {
                  // If not the organizer's event, return null
                  return null;
                }
              }
            }
          } catch (error) {
            console.error('Error in afterRead hook:', error);
            return null;
          }
        }
        
        return doc;
      },
    ],
  },
}

export { Tickets } 