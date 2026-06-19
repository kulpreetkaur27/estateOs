// DashboardPage.jsx
import React, { useContext } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FaHome, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { ThemeContext } from './ThemeContext';
import RealtorChat from './RealtorChat';

const GET_ALL_PROPERTIES = gql`
  query GetAllProperties($filter: PropertyFilterInput) {
    getAllProperties(filter: $filter) {
      id
      realtor {
        id
      }
    }
  }
`;

const GET_BOOKINGS = gql`
  query GetBookings($realtorId: ID) {
    getBookings(realtorId: $realtorId) {
      id
      date
      startTime
      endTime
      mode
      status
      notes
      client {
        id
      }
      realtor {
        id
      }
    }
  }
`;

const DashboardPage = () => {
  const { theme, themeClasses } = useContext(ThemeContext);

  // Retrieve the logged-in user and realtor id from localStorage
  const storedUser = localStorage.getItem('user');
  let realtorId = null;
  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      realtorId = userObj.id;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
  }

  const { data: propertiesData, loading: propertiesLoading, error: propertiesError } = useQuery(GET_ALL_PROPERTIES);
  const { data: bookingsData, loading: bookingsLoading, error: bookingsError } = useQuery(GET_BOOKINGS, {
    variables: { realtorId },
    fetchPolicy: "network-only", 
  });

  const totalListings =
    propertiesData &&
    propertiesData.getAllProperties &&
    realtorId
      ? propertiesData.getAllProperties.reduce((count, property) => {
          if (
            property.realtor &&
            (property.realtor.id === realtorId || property.realtor._id === realtorId)
          ) {
            return count + 1;
          }
          return count;
        }, 0)
      : 0;

  let activeClientsCount = 0;
  let appointmentsThisWeek = 0;
  let appointmentsByDay = [];
  if (bookingsData && bookingsData.getBookings) {
    const realtorBookings = bookingsData.getBookings;
    const clientIds = new Set();
    realtorBookings.forEach((booking) => {
      if (booking.client && (booking.client.id || booking.client._id)) {
        clientIds.add(booking.client.id || booking.client._id);
      }
    });
    activeClientsCount = clientIds.size;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    appointmentsThisWeek = realtorBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startOfWeek && bookingDate <= endOfWeek;
    }).length;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const dayLabel = currentDay.toLocaleDateString('default', {
        weekday: 'short',
      });
      const count = realtorBookings.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate.toDateString() === currentDay.toDateString();
      }).length;
      appointmentsByDay.push({ day: dayLabel, count });
    }
  }

  if (propertiesLoading || bookingsLoading) return <p>Loading...</p>;
  if (propertiesError) return <p>Error loading properties: {propertiesError.message}</p>;
  if (bookingsError) return <p>Error loading bookings: {bookingsError.message}</p>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard Overview
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
          <FaHome className="text-4xl mb-4" style={{ color: themeClasses.fill }} />
          <h3 className="text-xl font-semibold text-gray-800">
            Total Listings
          </h3>
          <p className="text-gray-500 text-3xl mt-2">{totalListings}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
          <FaUsers className="text-4xl mb-4" style={{ color: themeClasses.fill }} />
          <h3 className="text-xl font-semibold text-gray-800">
            Active Clients
          </h3>
          <p className="text-gray-500 text-3xl mt-2">{activeClientsCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
          <FaCalendarAlt className="text-4xl mb-4" style={{ color: themeClasses.fill }} />
          <h3 className="text-xl font-semibold text-gray-800">
            Appointments This Week
          </h3>
          <p className="text-gray-500 text-3xl mt-2">{appointmentsThisWeek}</p>
        </div>
      </div>

      {/* Appointments Breakdown Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Appointments Breakdown (This Week)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={appointmentsByDay} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={themeClasses.fill} name="Appointments" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <RealtorChat />
    </div>
  );
};

export default DashboardPage;
