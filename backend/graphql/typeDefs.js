const gql = require('graphql-tag');

module.exports = gql`

  scalar Upload

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    gender: String!
    phoneNumber: String!
    email: String!
    role: String!
    createdAt: String!
    profilePicture: String
    resetPasswordToken: String
    resetPasswordExpires: String
  }

  input CreateUserInput {
    firstName: String!
    lastName: String!
    gender: String!
    phoneNumber: String!
    email: String!
    password: String!
    confirmPassword: String!
    profilePicture: String
    role: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    phoneNumber: String
  }


  type Property {
    id: ID!
    title: String!
    description: String!
    price: Float!
    location: String!
    bedrooms: Int!
    bathrooms: Int!
    propertyType: String!
    squareFeet: Int!
    furnished: Boolean!
    hasParking: Boolean!
    features: [String]
    realtor: User!
    images: [String]
    archived: Boolean!      # Newly added field
    createdAt: String!
    isRelator: Boolean!
  }

  input PropertyFilterInput {
    propertyType: String
    minPrice: Float
    maxPrice: Float
    bedrooms: Int
    bathrooms: Int
    location: String
    dateListed: String
    sort: String
    realtor: ID
  }

  type AuthPayload {
    token: String!
    user: User!
  }


  input LoginInput {
    email: String!
    password: String!
  }

  input ResetPasswordInput {
    email: String!
  }

  
  type RealtorAvailability {
    id: ID!
    realtor: User!
    type: String!
    date: String
    startTime: String
    endTime: String
    startDate: String
    endDate: String
    note: String
    createdAt: String!
    deleted: Boolean!
  }

  type Query {
    getUsers: [User!]!
    getUserById(id: ID!): User
    getBookings(realtorId: ID): [Booking]
    getRealtorAvailability (realtorId: ID): [RealtorAvailability]
    getAllProperties(filter: PropertyFilterInput): [Property]
    getUniqueLocations: [String]
    getPropertyById(id: ID!): Property
    getAvailableSlots(date: String!, propertyId: ID!, realtorId: ID!): [Slot]
    getUniqueClients(realtorId: ID!): [User!]!
    getRealtorProperties(realtorId: ID!): [Property!]!
    getBookingsByClient(clientId: ID!): [Booking]
  }
    
  input ResetPasswordWithTokenInput {
    token: String!
    password: String!
  }

  type ResetPasswordResponse {
    success: Boolean!
    message: String!
    redirectTo: String!
  }
  
  type Booking {
    id: ID!
    date: String!
    startTime: String!
    endTime: String!
    mode: String!
    notes: String
    status: String!
    client: User!
    realtor: User!
    property: Property!
    name: String!
    email: String!
    phone: String!
    createdAt: String!
    updatedAt: String!
    zoomLink: String
    officeAddress: String
    created_by: User
    isRealtor: Boolean!
  }

  input BookingInput {
  date: String!
  slot: String
  startTime: String!
  endTime: String!
  mode: String!
  notes: String
  status: String!
  clientId: ID!
  realtorId: ID!
  propertyId: ID!
  name: String!
  email: String!
  phone: String!
}

    
  type BookingOutput {
    id: ID!
  }

  type Slot {
  startTime: String
  endTime: String
  }

  input RealtorAvailabilityInput {
    realtor: ID!
    type: String!           # e.g., "DAY", "TIME", or "RANGE"
    date: String            # used for "DAY" and "TIME" types
    startTime: String       # for "TIME" type (if needed)
    endTime: String         # for "TIME" type (if needed)
    startDate: String       # for "RANGE" type
    endDate: String         # for "RANGE" type
    note: String
  }

  input RealtorCancelAvailabilityInput {
    id: ID!
  }

  input RealtorBookingInput {
    date: String!
    startTime: String!
    endTime: String!
    mode: String!
    notes: String
    status: String
    clientId: ID!
    propertyId: ID!
    created_by: ID!
    realtorId: ID!
  }

  type Mutation {
    createUser(input: CreateUserInput!, profilePicture: Upload): User!
    login(email: String!, password: String!): AuthPayload!
    updateUser(id: ID!, input: UpdateUserInput!, profilePicture: Upload): User!
    deleteUser(id: ID!): Boolean
    resetPassword(input: ResetPasswordInput!): User!
    resetPasswordWithToken(input: ResetPasswordWithTokenInput!): ResetPasswordResponse!
    createBooking(input: BookingInput!): Booking
    confirmBooking(id: ID!): Booking
    createRealtorAvailability(input: RealtorAvailabilityInput!): RealtorAvailability!
    cancelRealtorAvailability(input: RealtorCancelAvailabilityInput!): RealtorAvailability!
    updateBookingStatus(id: ID!, status: String!): Booking!
    createRealtorBooking(input: RealtorBookingInput!) : Boolean
    addProperty(
      title: String!
      description: String!
      price: Float!
      location: String!
      bedrooms: Int!
      bathrooms: Int!
      propertyType: String!
      squareFeet: Int!
      furnished: Boolean
      hasParking: Boolean
      features: [String]
      realtor: ID!
      images: [Upload]
    ): Property

    updateProperty(
      id: ID!
      title: String
      description: String
      price: Float
      location: String
      bedrooms: Int
      bathrooms: Int
      propertyType: String
      squareFeet: Int
      furnished: Boolean
      hasParking: Boolean
      features: [String]
      images: [Upload]
    ): Property

    deleteProperty(id: ID!): String

    
  }
`;
