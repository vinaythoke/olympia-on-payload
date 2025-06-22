import { CollectionConfig, Access } from 'payload'
import crypto from 'crypto'

const TicketPurchases: CollectionConfig = {
  slug: 'ticket-purchases',
  admin: {
    useAsTitle: 'purchaseId',
    defaultColumns: ['purchaseId', 'ticket.name', 'purchaser.email', 'status', 'purchaseDate'],
  },
  access: {
    // Only authenticated users can create ticket purchases
    create: ({ req }) => {
      return Boolean(req.user);
    },
    // Users can read their own purchases, organizers can read purchases for their events, and superadmins can read all
    read: async ({ req, id }) => {
      if (!req.user) return false;
      
      // Superadmins can read all purchases
      if (req.user.role === 'superadmin') return true;
      
      try {
        // If we have an ID, we're looking at a specific purchase
        if (id) {
          const purchase = await req.payload.findByID({
            collection: 'ticket-purchases',
            id,
          });
          
          // Regular users can only see their own purchases
          if (req.user.role === 'participant') {
            const purchaserId = typeof purchase.purchaser === 'object' ? purchase.purchaser.id : purchase.purchaser;
            return purchaserId === req.user.id;
          }
          
          // Organizers need to check if the ticket belongs to their event
          if (req.user.role === 'organizer') {
            const ticketId = typeof purchase.ticket === 'object' ? purchase.ticket.id : purchase.ticket;
            const ticket = await req.payload.findByID({
              collection: 'tickets',
              id: ticketId,
            });
            
            const eventId = typeof ticket.event === 'object' ? ticket.event.id : ticket.event;
            const event = await req.payload.findByID({
              collection: 'events',
              id: eventId,
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
        } else {
          // For list views
          if (req.user.role === 'participant') {
            return {
              purchaser: {
                equals: req.user.id,
              },
            };
          }
          
          if (req.user.role === 'organizer') {
            // This is more complex and will require a custom query
            // For now, we'll return true and filter in the afterRead hook
            return true;
          }
        }
      } catch (error) {
        return false;
      }
      
      return false;
    },
    // Only superadmins can update purchases
    update: ({ req }) => {
      return req.user?.role === 'superadmin';
    },
    // Only superadmins can delete purchases
    delete: ({ req }) => {
      return req.user?.role === 'superadmin';
    },
  },
  fields: [
    {
      name: 'purchaseId',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'tickets',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'purchaser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      min: 1,
      defaultValue: 1,
      required: true,
    },
    {
      name: 'unitPrice',
      type: 'number',
      min: 0,
      required: true,
    },
    {
      name: 'totalAmount',
      type: 'number',
      min: 0,
      required: true,
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
      required: true,
    },
    {
      name: 'purchaseDate',
      type: 'date',
      required: true,
    },
    {
      name: 'formResponses',
      type: 'json',
      admin: {
        description: 'Responses to custom form fields',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        { label: 'Credit Card', value: 'credit-card' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Bank Transfer', value: 'bank-transfer' },
        { label: 'Free', value: 'free' },
      ],
    },
    {
      name: 'paymentDetails',
      type: 'json',
      admin: {
        description: 'Payment gateway response details',
      },
    },
    {
      name: 'ticketCode',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ data, req, operation }) => {
            if (operation === 'create' && data && !data.ticketCode) {
              const payload = req.payload;
              // Generate a unique code before creating the ticket purchase
              const eventId = typeof data.event === 'object' ? data.event.id : data.event;
              const purchaserId = typeof data.purchaser === 'object' ? data.purchaser.id : data.purchaser;
              const uniqueCode = `${eventId}-${purchaserId}-${new Date().getTime()}`;
              const hashedCode = crypto.createHash('sha256').update(uniqueCode).digest('hex');
              data.ticketCode = hashedCode;
              return data;
            }
          },
        ],
      },
    },
    {
      name: 'isCheckedIn',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this ticket has been used for entry',
      },
    },
    {
      name: 'checkInTime',
      type: 'date',
      admin: {
        description: 'When the ticket was checked in',
        condition: (data) => Boolean(data.isCheckedIn),
      },
    },
    {
      name: 'checkInPhoto',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'Photo taken during check-in',
        condition: (data) => Boolean(data.isCheckedIn),
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Generate a purchase ID on creation
        if (operation === 'create') {
          const timestamp = Date.now();
          const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          data.purchaseId = `PUR-${timestamp}-${randomPart}`;
          
          // Generate a unique ticket code
          const ticketCodeRandom = Math.random().toString(36).substring(2, 10).toUpperCase();
          data.ticketCode = `TIX-${ticketCodeRandom}`;
          
          // Set purchase date if not provided
          if (!data.purchaseDate) {
            data.purchaseDate = new Date().toISOString();
          }
          
          // Calculate total amount if not provided
          if (!data.totalAmount && data.unitPrice && data.quantity) {
            data.totalAmount = data.unitPrice * data.quantity;
          }
        }
        
        return data;
      },
    ],
    afterChange: [
      async ({ req, operation, doc }) => {
        // Update ticket remaining quantity on purchase
        if (operation === 'create' && doc.status === 'completed') {
          try {
            const ticket = await req.payload.findByID({
              collection: 'tickets',
              id: doc.ticket,
            });
            
            // Decrement the remaining quantity
            const newRemainingQuantity = Math.max(0, (ticket.remainingQuantity || 0) - doc.quantity);
            
            await req.payload.update({
              collection: 'tickets',
              id: doc.ticket,
              data: {
                remainingQuantity: newRemainingQuantity,
                // If sold out, update the status
                ...(newRemainingQuantity === 0 ? { status: 'sold-out' } : {}),
              },
            });
          } catch (error) {
            console.error('Error updating ticket quantity:', error);
          }
        }
      },
    ],
    afterRead: [
      async ({ req, doc }) => {
        // For organizers, we need to check if they have access to this purchase
        if (req.user?.role === 'organizer') {
          try {
            const ticketId = typeof doc.ticket === 'object' ? doc.ticket.id : doc.ticket;
            const ticket = await req.payload.findByID({
              collection: 'tickets',
              id: ticketId,
            });
            
            const eventId = typeof ticket.event === 'object' ? ticket.event.id : ticket.event;
            const event = await req.payload.findByID({
              collection: 'events',
              id: eventId,
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

export { TicketPurchases } 