import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import Navbar from './Navbar'; // Assuming you have a Navbar component

// Define the GraphQL query to fetch bookings by client ID
const GET_BOOKINGS_BY_CLIENT = gql`
  query GetBookingsByClient($clientId: ID!) {
    getBookingsByClient(clientId: $clientId) {
      id
      date
      startTime
      endTime
      status
      isRealtor
      client {
        id
        firstName
        lastName
        email
        phoneNumber
        profilePicture
      }
      realtor {
        id
        firstName
        lastName
        email
        phoneNumber
        profilePicture
      }
      property {
        id
        title
        location
      }
      name
      email
      phone
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_BOOKING_STATUS = gql`
  mutation UpdateBookingStatus($id: ID!, $status: String!) {
    updateBookingStatus(id: $id, status: $status) {
      id
      status
      zoomLink
      officeAddress
    }
  }
`;

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setClientId(user.id); 
    }
  }, []);

  const { data, loading, error } = useQuery(GET_BOOKINGS_BY_CLIENT, {
    variables: { clientId },
    skip: !clientId,
  });
  useEffect(() => {
    if (data) {
      setBookings(data.getBookingsByClient);
    }
  }, [data]);

  // Define the mutation hook for updating booking status
  const [updateBookingStatus] = useMutation(UPDATE_BOOKING_STATUS);

  // Handle booking status change
  const handleStatusChange = async (bookingId, status) => {
    try {
      const { data } = await updateBookingStatus({
        variables: { id: bookingId, status },
      });
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: data.updateBookingStatus.status } : booking
        )
      );
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Function to format the date as MM/DD/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US'); 
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error loading bookings. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="h-screen bg-gradient-to-tl from-blue-100 to-green-200 flex items-center justify-center">
        <div className="w-full max-w-7xl bg-white shadow-lg rounded-lg p-8 overflow-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Bookings</h2>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md mx-auto">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Property</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Realtor</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-3 px-4 text-center text-gray-500">
                      No bookings available
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-200">
                      <td className="py-3 px-4 text-sm text-gray-700">{booking.id}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{booking.property.title}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(booking.date)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {booking.startTime} - {booking.endTime}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {booking.client.firstName} {booking.client.lastName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {booking.realtor.firstName} {booking.realtor.lastName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        <span
                          className={`py-1 px-3 text-xs font-semibold rounded-full ${
                            booking.status === 'CONFIRMED'
                              ? 'bg-green-200 text-green-800'
                              : booking.status === 'PENDING'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {booking.isRealtor && booking.status === 'PENDING' && (
                          <select
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-indigo-700"
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              handleStatusChange(booking.id, newStatus);
                            }}
                          >
                            <option value="">Select Action</option>
                            <option value="CONFIRMED">Confirm</option>
                            <option value="CANCELLED">Cancel</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingList;
