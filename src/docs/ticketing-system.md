# Ticketing System Documentation

## Overview

The ticketing system allows event organizers to create and manage different types of tickets for their events. Participants can browse available tickets, purchase them, and receive confirmation. The system supports various ticket types, visibility rules, and inventory management.

## Architecture

### Collections

1. **Tickets Collection**
   - Stores ticket definitions with properties like name, type, price, quantity, etc.
   - Supports different ticket types: free, paid, RSVP, and protected
   - Includes visibility rules based on participant demographics
   - Tracks inventory with quantity and remainingQuantity fields

2. **TicketPurchases Collection**
   - Records ticket purchases with details like purchaser, quantity, price, etc.
   - Generates unique ticket codes for verification
   - Tracks payment status for paid tickets
   - Stores form responses for custom fields

### API Routes

1. **/api/tickets/list**
   - Lists available tickets for an event
   - Supports filtering by ticket type
   - Handles visibility rules for public vs. private tickets

2. **/api/tickets/purchase**
   - Processes ticket purchases
   - Validates ticket availability and access codes
   - Creates purchase records and updates inventory
   - Handles different ticket types appropriately

3. **/api/tickets/verify**
   - Verifies ticket codes for event check-in
   - Returns ticket and event details for valid codes

### React Components

1. **TicketList**
   - Displays available tickets for an event
   - Shows pricing, availability, and ticket type
   - Handles selection for purchase

2. **TicketPurchaseForm**
   - Collects purchase information
   - Handles quantity selection and access codes for protected tickets
   - Submits purchase requests to the API

## Ticket Types

1. **Free Tickets**
   - No cost to participants
   - Requires registration to track attendance
   - Limited by available quantity

2. **Paid Tickets**
   - Requires payment to complete purchase
   - Supports different currencies
   - Payment status tracking (pending, completed, refunded)

3. **RSVP Tickets**
   - Simple attendance confirmation
   - No payment required
   - Limited by available quantity

4. **Protected Tickets**
   - Access restricted by password, PIN, or access code
   - Can be free or paid
   - Useful for private or exclusive events

## Visibility Rules

Tickets can have visibility rules based on participant demographics:

1. **Age Range**
   - Restrict tickets to participants within specific age ranges
   - Example: Youth tickets (13-18), Adult tickets (18+)

2. **Gender**
   - Offer tickets specifically for certain genders
   - Example: Women-only workshop tickets

3. **Location**
   - Restrict tickets to participants from specific countries
   - Example: Regional early-bird tickets

## Inventory Management

The system automatically tracks ticket inventory:

1. **Quantity Tracking**
   - Initial quantity set when creating tickets
   - Remaining quantity updated with each purchase
   - Automatic "sold out" status when quantity reaches zero

2. **Overbooking Prevention**
   - Validates available quantity before confirming purchases
   - Concurrent purchase handling to prevent race conditions

## Custom Form Fields

Tickets can be associated with custom form fields:

1. **Form Builder Integration**
   - Link tickets to forms created with the Form Builder
   - Collect additional information during ticket purchase
   - Store responses with the ticket purchase record

## Usage Flow

### For Organizers:

1. Create an event
2. Enable ticketing in event settings
3. Create tickets with appropriate types, prices, and quantities
4. Optionally set visibility rules and custom form fields
5. Monitor ticket sales and check-in attendees using ticket verification

### For Participants:

1. Browse available tickets for an event
2. Select desired ticket type and quantity
3. Complete purchase process (payment if required)
4. Receive ticket confirmation with unique code
5. Present code for check-in at the event

## Security Considerations

1. **Access Control**
   - Only organizers and superadmins can create and manage tickets
   - Participants can only see tickets they're eligible for
   - Purchase records are protected with appropriate access controls

2. **Protected Tickets**
   - Secure storage of access codes/passwords
   - Validation during purchase process
   - Rate limiting to prevent brute force attacks

3. **Payment Security**
   - Secure handling of payment information
   - Clear status tracking for payment verification
   - Audit logging for all payment-related actions

## Future Enhancements

1. **Discount Codes**
   - Support for promotional codes and discounts
   - Time-limited offers and early bird pricing

2. **Group Purchases**
   - Allow bulk purchases for groups
   - Special pricing for group tickets

3. **Waitlists**
   - Enable waitlists for sold-out tickets
   - Automatic notification when tickets become available

4. **Check-in App**
   - Mobile app for event staff to scan and verify tickets
   - Real-time attendance tracking

5. **Analytics**
   - Sales reports and projections
   - Attendee demographics analysis 