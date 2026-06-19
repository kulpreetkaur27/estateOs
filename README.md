# EstateOS

EstateOS is a full-stack real estate management platform built for property discovery, appointment scheduling, realtor operations, and client communication. It combines a public property browsing experience with a private realtor portal, giving both sides of the real estate workflow one connected application.

The project is designed as a portfolio-ready MERN-style application with React, GraphQL, MongoDB, authentication, file uploads, booking workflows, email notifications, Zoom meeting generation, and real-time chat.

## Why This Project Stands Out

- Built a complete real estate workflow instead of a simple listing page.
- Implemented separate experiences for clients and realtors.
- Used GraphQL for structured data access across users, properties, bookings, and availability.
- Added real-time messaging with Socket.IO and JWT-protected socket connections.
- Integrated operational features such as image uploads, password reset emails, booking emails, and Zoom links.
- Designed the system around realistic business entities: users, properties, bookings, realtor availability, and conversations.

## Core Features

### Client Experience

- Browse active property listings.
- Filter properties by type, price range, bedrooms, bathrooms, location, realtor, and listing date.
- View detailed property pages with images, amenities, pricing, and realtor information.
- Book property viewings with date, time slot, mode, notes, and contact details.
- Choose between in-person and Zoom appointments.
- View booking history and appointment status.
- Manage profile settings and profile picture.
- Reset password through email-based recovery flow.

### Realtor Portal

- Realtor dashboard for managing real estate activity.
- Create, update, and archive property listings.
- Upload property images through GraphQL upload support.
- View and manage appointments.
- Confirm or cancel booking requests.
- Automatically generate Zoom links for virtual appointments.
- Track unique clients from booking activity.
- Manage realtor availability and time-off periods.
- Chat with clients in real time, organized by client and property.

### Backend Capabilities

- GraphQL API with queries and mutations for users, properties, bookings, and availability.
- JWT authentication for protected HTTP and socket routes.
- MongoDB data modeling with Mongoose.
- Password hashing with bcrypt.
- Email notifications through Nodemailer.
- Image upload support through GraphQL Upload and Imgur integration.
- REST endpoints for chat history, conversations, and read receipts.
- Socket.IO server for authenticated real-time messaging.
- Soft-delete style property archiving to preserve listing history.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Apollo Client, Tailwind CSS |
| UI/UX | Framer Motion, Lucide React, React Icons, React Slick, Recharts |
| Backend | Node.js, Express, Apollo Server, GraphQL |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Realtime | Socket.IO |
| Uploads | GraphQL Upload, Multer, Imgur |
| Communication | Nodemailer, Zoom API |
| Tooling | ESLint, npm |

## Architecture

```text
EstateOS
+-- frontend
|   +-- React/Vite application
|   +-- Apollo Client GraphQL integration
|   +-- Public property pages
|   +-- Realtor portal screens
|
+-- backend
    +-- Express server
    +-- Apollo GraphQL API
    +-- MongoDB/Mongoose models
    +-- JWT authentication
    +-- Socket.IO messaging
    +-- Email services
    +-- Zoom meeting integration
```

## Main Application Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/property-listings` | Browse listings |
| `/property-details/:id` | Property details |
| `/bookings/:id` | Book a property viewing |
| `/bookings` | Client booking list |
| `/login` | Login and registration flow |
| `/forgot-password` | Request password reset |
| `/reset-password` | Reset password with token |
| `/user-settings` | Client profile settings |
| `/realtor-dashboard` | Realtor dashboard |
| `/realtor-portal/listings` | Manage listings |
| `/realtor-portal/clients` | View clients |
| `/realtor-portal/appointments` | Manage appointments |
| `/realtor-portal/chat` | Realtor chat |
| `/realtor-portal/settings` | Realtor settings |

## GraphQL Highlights

The GraphQL API supports:

- User registration, login, profile updates, and password reset.
- Property creation, update, filtering, detail lookup, and archiving.
- Booking creation, status updates, confirmation, and cancellation.
- Realtor availability management.
- Available slot calculation based on existing bookings.
- Client and realtor-specific booking views.

Example query areas:

```graphql
getAllProperties(filter: PropertyFilterInput): [Property]
getPropertyById(id: ID!): Property
getAvailableSlots(date: String!, propertyId: ID!, realtorId: ID!): [Slot]
getBookings(realtorId: ID): [Booking]
getBookingsByClient(clientId: ID!): [Booking]
```

Example mutation areas:

```graphql
createUser(input: CreateUserInput!, profilePicture: Upload): User!
login(email: String!, password: String!): AuthPayload!
addProperty(..., images: [Upload]): Property
createBooking(input: BookingInput!): Booking
updateBookingStatus(id: ID!, status: String!): Booking!
createRealtorAvailability(input: RealtorAvailabilityInput!): RealtorAvailability!
```

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB database
- SMTP credentials for email features
- Imgur client ID for image upload features
- Zoom Server-to-Server OAuth credentials for virtual meeting links

### 1. Clone The Repository

```bash
git clone <repository-url>
cd estateOs
```

### 2. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside `backend`.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
APP_URL=http://localhost:5173/

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

IMGUR_CLIENT_ID=your_imgur_client_id

ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
```

### 4. Confirm The GraphQL Endpoint

The backend defaults to:

```text
http://localhost:5000/graphql
```

The frontend Apollo client is configured in:

```text
frontend/src/ApolloProvider.jsx
```

If needed, update the Apollo URI so it matches your backend port.

### 5. Run The Application

Start the backend:

```bash
cd backend
npm start
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, typically:

```text
http://localhost:5173
```

## Data Models

EstateOS uses focused MongoDB collections for the main product workflows:

- `User`: client and realtor accounts, profile details, roles, reset tokens.
- `Property`: listing details, features, image URLs, realtor ownership, archive status.
- `Booking`: appointment date, time, mode, status, client, realtor, property, Zoom link, office address.
- `RealtorAvailability`: day, time, or date-range availability records.
- `Message`: sender, recipient, property context, read status, and timestamp.

## Interview Talking Points

- Designed a role-aware real estate platform with both public and private workflows.
- Modeled real business relationships between clients, realtors, properties, appointments, and messages.
- Used GraphQL to reduce frontend/backend coupling and keep data access predictable.
- Implemented booking conflict prevention by calculating available appointment slots.
- Added production-style integrations: email delivery, image hosting, JWT auth, and Zoom meetings.
- Built real-time chat with authenticated Socket.IO connections and persisted message history.
- Used soft archiving for properties so records are not permanently deleted from the system.

## Future Improvements

- Add automated tests for GraphQL resolvers and booking conflict logic.
- Move frontend API URLs into environment variables.
- Add role-based route guards on the frontend.
- Add pagination for listings, bookings, and chat history.
- Add deployment configuration for production environments.
- Improve observability with structured logging and centralized error handling.

## Project Status

EstateOS is a functional full-stack portfolio project that demonstrates practical product thinking, backend API design, frontend development, real-time communication, and third-party service integration in a single real estate domain.
