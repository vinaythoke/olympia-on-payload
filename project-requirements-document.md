# Product Requirements Document (PRD): Olympia

## 1. Introduction

### 1.1 Problem Statement

Event organizers face challenges with:

- **Lack of Control**: Limited customization in registration forms.
- **Security Concerns**: No robust participant identity verification.
- **Inflexible Ticketing**: Can't restrict access based on demographics or profile data.
- **Inefficient Volunteer Management**: Manual and unscalable systems.
- **Fragmented Experience**: Disconnected participant journey from registration to check-in.

### 1.2 Proposed Solution: Olympia

Olympia is a fully responsive **Progressive Web App (PWA)** for end-to-end event registration. It provides:

- Custom visual form builder.
- Aadhaar/PAN-based profile verification.
- Advanced ticketing rules.
- Volunteer management with QR check-in.

### 1.3 Target Audience

- **Event Organizers**: Businesses and individuals running events.
- **Participants**: People registering and attending events.
- **Volunteers**: On-ground support staff for check-in and validation.

## 2. User Roles and Permissions

### 2.1 Superadmin

- Add/manage Organizer accounts.
- Full platform oversight.

### 2.2 Organizer

- Create/manage profile and events.
- Design registration forms.
- Create/manage ticket types.
- Set demographic-based access rules.
- Add/manage volunteers.
- View dashboard analytics.
- Cannot self-register—added by Superadmin.

### 2.3 Participant

- Self-sign up and manage profile.
- Discover and register for events.
- Initiate Aadhaar/PAN verification via SecureID.
- RSVP or purchase tickets.
- Access digital tickets with barcodes.

### 2.4 Volunteer

- Login and view assigned events.
- Scan tickets via device camera.
- Take participant photo at check-in.
- Mark participant as "entered."
- Added by Organizer; cannot self-register.

## 3. Features

### 3.1 Event Creation and Management

- **Visual Form Builder**: Drag-and-drop for text, dropdowns, uploads, etc.
- **Event Page**: Custom URL with:
  - Event details.
  - Countdown timer.
  - Organizer info tile.

- **Ticketing**:
  - Free/RSVP, Paid, Password/PIN-protected.
  - Control ticket visibility (gender, age, location, verification).
  - Choose what form data shows on ticket.

### 3.2 Participant Verification System

- **Integration**: Cashfree SecureID.
- **Verification Options**: Aadhaar, PAN, or both.
- **Profile Badge**: “Verified” tag on participant profile.

### 3.3 Volunteer Management and Check-In

- Assign per event.
- Scan QR code via mobile.
- Mandatory photo capture during check-in.
- Real-time sync to Organizer dashboard.

### 3.4 Organizer Dashboard

- Live entry tracking.
- Demographics and sales analytics.
- Ticket category breakdown.

### 3.5 Participant Experience

- **"My Tickets"** section.
- **Digital Tickets** with:
  - Barcode.
  - Event info.
  - Custom fields from form.

## 4. Technical Specifications

- Platform: 100% responsive PWA.
- **Offline Support**: Ticket viewing and check-in work offline; syncs on reconnection.
- **Third-Party Integration**:
  - Verification: Cashfree SecureID.

## 5. User Flow

### 5.1 Superadmin Flow

1. Login → "Organizers" → Add Organizer.
2. Organizer receives login credentials.

### 5.2 Organizer Flow

1. Login → Dashboard → "Create Event".
2. Enter event details and build form.
3. Set tickets and rules → Publish.
4. Add volunteers → Track event via dashboard.

### 5.3 Participant Flow

1. Visit site → Sign up → (optional) Verify ID.
2. Browse → Register → Fill form → Buy/RSVP.
3. View ticket in “My Tickets” → Use barcode at entry.

### 5.4 Volunteer Flow

1. Receive credentials → Login.
2. Select event → Scan ticket → Take photo → Mark as entered.

## 6. Success Metrics

### Platform Adoption

- # of active Organizers.
- Monthly new Participants.
- Monthly event count.

### Engagement

- Ticket sales per event.
- Verification completion rate.

### Organizer Satisfaction

- Organizer retention.
- Feedback and feature requests.

### Performance

- Uptime.
- Ticket scan speed.

## 7. Future Considerations (Out of Scope for v1.0)

- More ID verification options.
- Advanced analytics.
- Event marketing tools.
- Native mobile apps.
- Seating plans.
- Social sharing features.
