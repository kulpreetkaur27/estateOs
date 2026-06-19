# EstateOS

A full-stack real estate platform connecting property buyers with realtors — 
built with React, GraphQL, Node.js, MongoDB, and Socket.IO.

---

## Overview

EstateOS covers both sides of the real estate workflow in one application:

- **Clients** browse listings, book property viewings (in-person or Zoom), 
  and message realtors in real time
- **Realtors** manage listings, handle appointments, track clients, 
  and chat with buyers through a dedicated portal

---

## Tech Stack

| Area | Technologies |
|------|-------------|
| Frontend | React, Vite, Apollo Client, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Apollo Server, GraphQL |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Realtime | Socket.IO |
| Uploads | GraphQL Upload, Multer, Imgur |
| Communication | Nodemailer, Zoom API |

---

## Features

**Client side**
- Browse and filter properties by type, price, bedrooms, location, and realtor
- Book property viewings with in-person or Zoom appointment options
- View booking history and appointment status
- Real-time chat with realtors
- Profile management and password reset via email

**Realtor portal**
- Dashboard with appointment overview and client tracking
- Create, update, and archive property listings with image uploads
- Confirm or cancel booking requests
- Auto-generate Zoom links for virtual appointments
- Manage availability and time-off periods
- Real-time chat with clients, organized by property

**Backend**
- GraphQL API for users, properties, bookings, and availability
- JWT auth on both HTTP and Socket.IO connections
- Soft-delete property archiving (listing history preserved)
- REST endpoints for chat history and read receipts
- Email notifications for bookings and password resets

---

## Screenshots

<!-- Add 3-4 screenshots here once deployed -->

---

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB (Atlas free tier works)
- SMTP credentials (Gmail works with App Passwords)
- Imgur Client ID (free at api.imgur.com)
- Zoom Server-to-Server OAuth credentials

### Installation

```bash
git clone https://github.com/kulpreetkaur27/estateOs.git
cd estateOs
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
APP_URL=http://localhost:5173/

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

IMGUR_CLIENT_ID=your_imgur_client_id

ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
```

---

## API Highlights

Key GraphQL queries:
```graphql
getAllProperties(filter: PropertyFilterInput): [Property]
getAvailableSlots(date: String!, propertyId: ID!, realtorId: ID!): [Slot]
getBookingsByClient(clientId: ID!): [Booking]
```

Key mutations:
```graphql
createBooking(input: BookingInput!): Booking
updateBookingStatus(id: ID!, status: String!): Booking!
createRealtorAvailability(input: RealtorAvailabilityInput!): RealtorAvailability!
```

---

## Data Models

| Model | Purpose |
|-------|---------|
| `User` | Client and realtor accounts, roles, reset tokens |
| `Property` | Listings, images, realtor ownership, archive status |
| `Booking` | Appointment details, mode, status, Zoom link |
| `RealtorAvailability` | Day/time availability and time-off records |
| `Message` | Chat messages with read status and property context |

---

## Future Improvements

- Automated tests for GraphQL resolvers and booking conflict logic
- Role-based route guards on the frontend
- Pagination for listings, bookings, and chat history
- Move frontend API URLs into environment variables
- Structured logging and centralized error handling