# Technical Specification Document

## Project: Olympia

**Version:** 1.0  
**Date:** June 21, 2025  
**Author:** Gemini  
**Changes:** Initial Draft  

---

## 1. Introduction

This document provides the detailed technical specifications for the development of Project Olympia, a full-featured event registration platform. It serves as a technical blueprint that expands upon the functional requirements outlined in the Product Requirements Document (PRD).

The primary goal of this TSD is to define the system architecture, technology stack, data models, API contracts, and development environment, enabling a clear and efficient development process for a human or AI-driven engineering team.

---

## 2. High-Level Architecture

The system will be built using a headless, decoupled architecture. This separates the backend content and logic management from the frontend presentation layer, offering maximum flexibility and scalability.

+--------------------------------+ +--------------------------------+
| Frontend (Next.js PWA) | | UI Components |
| | | (Storybook) |
| - UI/UX (React Components) | | |
| - PWA (Service Workers) | | - Atomic Components |
| - Offline Functionality | | - Interactive Docs |
| - QR Code Scanning |<---->| |
+--------------------------------+ +--------------------------------+
^
| (REST/GraphQL API)
v
+--------------------------------+ +--------------------------------+
| Backend (Payload CMS) | | 3rd Party Services |
| | | |
| - Data & Logic Management |<---->| - Cashfree SecureID (Verify) |
| - Custom API Endpoints | | - Email Service (e.g. Resend) |
| - Role-Based Access Control | +--------------------------------+
| - Form Builder Plugin |
+--------------------------------+
^
| (DB Connection)
v
+--------------------------------+
| Database (PostgreSQL) |
| |
| - Hosted via Local Supabase |
| - Stores all application data |
+--------------------------------+

     |----------------------------|
     | Dockerized Environment     |
     | (docker-compose)           |
     |----------------------------|

---

## 3. Technology Stack

| Category             | Technology             | Version/Details | Justification |
|----------------------|------------------------|------------------|---------------|
| Backend Framework    | Payload CMS            | latest           | Code-first, highly extensible |
| Database             | PostgreSQL             | 15+              | Reliable and scalable |
| Frontend Framework   | Next.js                | 14+              | Excellent PWA support |
| Programming Language | TypeScript             | 5+               | Type safety, fewer bugs |
| Styling              | Tailwind CSS           | latest           | Utility-first, consistent UI |
| UI Documentation     | Storybook              | latest           | Component isolation/testing |
| State Management     | React Query / SWR      | latest           | Server state and caching |
| Containerization     | Docker & Docker Compose| latest           | Simplified environment setup |

---

## 4. Development & Deployment Environment

### Docker Setup

version: '3.8'
services:
  payload:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/usr/src/app
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
    command: "npm run dev"

  nextjs:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "8080:3000"
    volumes:
      - ./frontend:/usr/src/app
    env_file:
      - ./frontend/.env
    command: "npm run dev"

  storybook:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "6006:6006"
    volumes:
      - ./frontend:/usr/src/app
    env_file:
      - ./frontend/.env
    command: "npm run storybook"

### backend/.env
DATABASE_URI=postgres://...
PAYLOAD_SECRET=...
CASHFREE_CLIENT_ID=...
CASHFREE_CLIENT_SECRET=...

### backend/.env
NEXT_PUBLIC_PAYLOAD_URL=http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:8080

## 5. Backend Specification (Payload CMS)

### 5.1 Configuration

- **Database Adapter:** `payload-db-postgres`
- **Plugins:** Form Builder, (optional) WebSocket
- **GraphQL API:** Enabled

### 5.2 Data Models (Collections)

#### `users`
- `email` (required, unique)  
- `password`  
- `name` (required)  
- `role`: `superadmin`, `organizer`, `participant`, `volunteer`  
- `verification`:  
  - `aadhaar`  
  - `pan`  
  - `verifiedData` (JSON)  

#### `organizers`
- `organizerName`  
- `user` (relation to `users`, unique)

#### `volunteers`
- `user` (relation to `users`, unique)  
- `managedBy` (relation to `organizers`)  
- `assignedEvents` (relation to `events`)

#### `events`
- `title`, `organizer`, `status`  
- `eventBanner` (media)  
- `description`, `eventDate`  
- `registrationForm` (FormBuilder blocks)

#### `tickets`
- `name`, `type`, `price`, `quantity`, `accessRules`  
- `event` (relation to `events`)

#### `registrations`
- `participant`, `event`, `ticket`  
- `ticketId` (human-readable unique ID)  
- `qrCode` (readonly)  
- `formData` (JSON)  
- `status`: `active`, `checked-in`  
- `checkInPhoto` (media), `checkInTimestamp`

### 5.3 Custom API Endpoints

| Method | Path                  | Auth        | Description                         |
|--------|-----------------------|-------------|-------------------------------------|
| POST   | /api/verify/initiate  | Participant | Aadhaar or PAN verification init    |
| POST   | /api/cashfree-webhook | Public      | Webhook listener with verification  |
| POST   | /api/check-in         | Volunteer   | Validate and check-in participant   |

### 5.4 Hooks

- `afterChange` on `registrations`: Generate `ticketId` and `qrCode`
- `beforeChange` on `tickets`: Validate `accessRules` with `verifiedData`

---

## 6. Frontend Specification (Next.js PWA)

### 6.1 Offline Strategy

- Caching via `sw.js`
- Prefetch volunteer event data
- Offline queue using `IndexedDB`
- Sync back when online

### 6.2 Folder Structure

- frontend  
  - app  
    - (auth) — login/signup routes  
    - (platform) — main app routes  
      - events  
      - my-tickets  
      - verify-profile  
      - volunteer  
    - layout.tsx  
    - page.tsx  
  - components  
    - ui — ShadCN/UI components (Button, Input, etc.)  
    - forms — Form-specific components  
    - events — Event-related components  
  - lib — helper functions, API clients  
  - hooks — custom React hooks  
  - public — static assets like manifest.json, icons, etc.  


---

## 7. UI Component Library (Storybook)

| Category | Component        | Description                    |
|----------|------------------|--------------------------------|
| Core     | Button, Input    | Standard UI elements           |
| Layout   | Card, Modal      | Wrappers and dialogs           |
| Forms    | FormRenderer     | Renders forms dynamically      |
| Upload   | FileUpload       | File selection/upload UI       |
| Events   | EventCard        | Event summaries                |
| Tickets  | TicketCard       | Ticket rules and prices        |
| Utility  | QRScanner        | Camera interface for scanning  |
| Visuals  | VerifiedBadge    | Visual status indication       |

---

## 8. Third-Party Integration

### Cashfree SecureID

**Flow:**  
Frontend initiates verify call → Backend interacts with Cashfree → Cashfree handles UI → Webhook sends status to backend

**Security:**
- API keys stored in backend-only env files
- All webhook requests verified via signature

---

## 9. Security Considerations

- JWT-based authentication (Payload default)
- Role-based access control (RBAC)
- All `.env` secrets ignored in Git
- Strict CORS policy
- Encrypted verified data from Cashfree


