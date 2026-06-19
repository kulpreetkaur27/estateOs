import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import Navbar from './Navbar';

// Define the createBooking mutation inline
const CREATE_BOOKING = gql`
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      id
      date
      startTime
      endTime
      mode
      notes
      status
      name
      email
      phone
      createdAt
      updatedAt
    }
  }
`;

// Define the GET_PROPERTY_BY_ID query inline
const GET_PROPERTY_BY_ID = gql`
  query GetPropertyById($id: ID!) {
    getPropertyById(id: $id) {
      id
      title
      description
      price
      location
      bedrooms
      bathrooms
      propertyType
      squareFeet
      furnished
      hasParking
      features
      realtor {
        id
        firstName
        lastName
        email
        phoneNumber
        profilePicture
      }
      images
      createdAt
    }
  }
`;

const GET_AVAILABLE_SLOTS = gql`
  query GetAvailableSlots($date: String!, $propertyId: ID!, $realtorId: ID!) {
    getAvailableSlots(date: $date, propertyId: $propertyId, realtorId: $realtorId) {
      startTime
      endTime
    }
  }
`;


const Booking = () => {
  // Extract property ID from the URL
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // 1. Fetch property details using the property ID
  const { loading, error, data } = useQuery(GET_PROPERTY_BY_ID, {
    variables: { id },
  });

  // 2. Set up the createBooking mutation
  const [createBooking] = useMutation(CREATE_BOOKING);

  // 3. Image slider state
  const [currentIndex, setCurrentIndex] = useState(0);

  // 4. Booking form state
  // Ensure clientId is a valid ObjectId (dummy fallback provided for testing)

    useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      else {
        setFormError("Please login to proceed");
      }
    }, []);

  
  const [formError, setFormError] = useState("");

  // Note: Removed startTime and endTime; added slot
  const [bookingDetails, setBookingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    slot: '', // new field for the selected time slot
    mode: 'IN_PERSON', // default mode
    notes: '',
    status: 'PENDING', // default status
  });

  const { data: slotsData, loading: slotsLoading } = useQuery(GET_AVAILABLE_SLOTS, {
    variables: {
      date: bookingDetails.date,
      propertyId: id,
      realtorId: data?.getPropertyById?.realtor?.id,
    },
    skip: !bookingDetails.date || !data?.getPropertyById?.realtor?.id,
  });
  

  // 5. Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Phone masking: XXX-XXX-XXXX
    if (name === "phone") {
      // Remove all non-digits
      const digits = value.replace(/\D/g, "").slice(0, 10); // Max 10 digits
  
      let formatted = digits;
      if (digits.length > 3 && digits.length <= 6) {
        formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else if (digits.length > 6) {
        formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
  
      setBookingDetails((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setBookingDetails((prev) => ({ ...prev, [name]: value }));
    }
  
    setFormError(""); // clear error if user edits
  };

  // 6. Submit booking
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Obtain the realtor ID from the property data.
      const realtorId = data?.getPropertyById?.realtor?.id;
      if (!realtorId) {
        throw new Error('Realtor ID not found for this property.');
      }

      // Split the selected slot into start and end times.
      const [startTime, endTime] = bookingDetails.slot.split(' - ');
      if (!startTime || !endTime) {
        throw new Error('Please select a valid time slot.');
      }

      // Prepare the input matching your BookingInput,
      // using the property ID from the URL.
      const input = {
        date: bookingDetails.date,
        startTime,
        endTime,
        mode: bookingDetails.mode,
        notes: bookingDetails.notes,
        status: bookingDetails.status,
        propertyId: id,         // Use propertyId directly
        realtorId: realtorId,     // Use realtorId directly
        clientId: user.id,       // Use clientId directly
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
      };
      console.log('Booking input:', input);

      const response = await createBooking({ variables: { input } });

      navigate(`/booking-confirmed/${response.data.createBooking.id}`);
    } catch (err) {
      console.error("Error creating booking:", err);
    
      const message =
        err?.graphQLErrors?.[0]?.message ||
        err?.message ||
        "Something went wrong while submitting your booking.";
    
      setFormError(message);
    }
  };

  // 7. Image slider handlers
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? data.getPropertyById.images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === data.getPropertyById.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 8. Handle loading / error states
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading property details...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p>Error loading property details.</p>
        </div>
      </>
    );
  }

  // 9. Get the property data from the query
  const property = data.getPropertyById;

  return (
    <>
      <Navbar />
      <div className="mt-20 min-h-screen bg-gradient-to-r from-green-100 to-blue-200 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-6xl bg-white rounded-lg shadow-2xl p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Booking Form */}
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Book Appointment</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                {formError && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Oops!</strong>
                    <span className="block sm:inline ml-2">{formError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={bookingDetails.name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    
                  />
                </div>
                {/* Email */}
                <div>
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="text"
                    name="email"
                    value={bookingDetails.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={bookingDetails.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="123-456-7890"
                  />

                </div>
                {/* Date */}
                <div>
                  <label className="block text-gray-700">Select Date</label>
                  <input
                    type="date"
                    name="date"
                    value={bookingDetails.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]} // prevents past date selection
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    
                  />

                </div>
                {/* Time Slot Dropdown */}
                <div>
                  <label className="block text-gray-700">Select Time Slot</label>
                  <select
                    name="slot"
                    value={bookingDetails.slot}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    
                  >
                    <option value="">Select a slot</option>
                    {slotsLoading && <option disabled>Loading slots...</option>}
                    {!slotsLoading && slotsData?.getAvailableSlots?.length === 0 && (
                      <option disabled>No slots available</option>
                    )}
                    {slotsData?.getAvailableSlots?.map((slot, index) => (
                      <option key={index} value={`${slot.startTime} - ${slot.endTime}`}>
                        {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>

                </div>
                {/* Mode */}
                <div>
                  <label className="block text-gray-700">Mode</label>
                  <select
                    name="mode"
                    value={bookingDetails.mode}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    
                  >
                    <option value="IN_PERSON">In Person</option>
                    <option value="ZOOM">Zoom</option>
                  </select>
                </div>
                {/* Notes (optional) */}
                <div>
                  <label className="block text-gray-700">Notes (optional)</label>
                  <textarea
                    name="notes"
                    value={bookingDetails.notes}
                    onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg transform hover:-translate-y-0.5 ${formError ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!!formError}
                >
                  Confirm Booking
                </button>

              </form>
              <button
                onClick={() => navigate(-1)}
                className="mt-4 w-full text-center text-blue-600 hover:text-blue-800 font-medium"
              >
                &larr; Back to Property Details
              </button>
            </div>

            {/* Right Column: Property Summary */}
            <div className="w-full md:w-1/2">
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                {/* Image Slider */}
                {property.images && property.images.length > 0 ? (
                  <div className="relative">
                    <img
                      src={property.images[currentIndex]}
                      alt={`${property.title} ${currentIndex + 1}`}
                      className="w-full h-64 object-cover rounded-lg transition-all duration-500 mb-4"
                    />
                    {property.images.length > 1 && (
                      <div className="flex justify-between -mt-8">
                        <button
                          onClick={handlePrev}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-200 transition-colors"
                        >
                          &larr;
                        </button>
                        <button
                          onClick={handleNext}
                          className="bg-white p-2 rounded-full shadow hover:bg-gray-200 transition-colors"
                        >
                          &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src="https://placehold.co/400x300"
                    alt={property.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                <h3 className="text-xl font-bold text-purple-800 mb-4">
                  {property.title}
                </h3>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Location:</span> {property.location}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">Price:</span> ${property.price}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Bedrooms:</span> {property.bedrooms}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Bathrooms:</span> {property.bathrooms}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Sq Ft:</span> {property.squareFeet}
                  </div>
                </div>
                <p className="text-gray-700 mt-4">
                  <span className="font-semibold">Description:</span> {property.description}
                </p>
                {property.features && property.features.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-bold text-purple-800">Features:</h4>
                    <ul className="list-disc ml-6 mt-2 text-gray-700">
                      {property.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Booking;
