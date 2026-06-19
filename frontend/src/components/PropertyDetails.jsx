// PropertyDetails.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import Navbar from './Navbar';
import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import Chat from './Chat';

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
        profilePicture
        phoneNumber
      }
      images
      createdAt
    }
  }
`;

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data } = useQuery(GET_PROPERTY_BY_ID, {
    variables: { id },
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  if (loading) {
    return <p className="pt-20 text-center">Loading...</p>;
  }

  if (error) {
    return (
      <p className="pt-20 text-center text-red-500">Error loading property details.</p>
    );
  }

  const property = data.getPropertyById;

  // Slider navigation
  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? property.images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === property.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <>
      <Navbar />

      {/* Outer container with a gradient background */}
      <div className="mt-20 min-h-screen bg-gradient-to-r from-purple-100 to-blue-100 flex justify-center px-4">
        {/*
          If you want vertical centering, add "items-center":
          e.g., className="min-h-screen bg-gradient-to-r ... flex items-center justify-center px-4"
        */}

        {/* Card container with custom inline margins */}
        <div
          className="relative w-full max-w-5xl bg-white rounded-lg shadow-2xl p-8"
          style={{ marginTop: '100px', marginBottom: '100px' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Listings
          </button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Image Slider & Realtor Info */}
            <div className="flex flex-col gap-6">
              {/* Image Slider */}
              <div className="relative">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[currentIndex]}
                    alt={`${property.title} ${currentIndex + 1}`}
                    className="w-full h-64 object-cover rounded-lg transition-all duration-500"
                  />
                ) : (
                  <img
                    src="https://placehold.co/400x300"
                    alt={property.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
                {property.images && property.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200 transition-colors"
                    >
                      <FaChevronLeft className="text-gray-700" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200 transition-colors"
                    >
                      <FaChevronRight className="text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Realtor Info */}
              <div className="bg-gray-50 p-4 rounded-lg shadow">
                <h3 className="text-xl font-bold text-purple-800 mb-3">
                  Realtor Information
                </h3>
                <div className="flex items-center gap-4">
                  {property.realtor.profilePicture && (
                    <img
                      src={property.realtor.profilePicture}
                      alt="Realtor"
                      className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                    />
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {property.realtor.firstName} {property.realtor.lastName}
                    </p>
                    <p className="text-gray-600">{property.realtor.email}</p>
                    <p className="text-gray-600">{property.realtor.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Property Details */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 leading-tight">
                  {property.title}
                </h1>
                <p className="text-gray-600 mt-2 text-sm md:text-base">
                  {property.location}
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-3">
                  ${property.price}
                </p>

                {/* Property stats */}
                <div className="flex flex-wrap gap-4 mt-4 text-gray-700">
                  <div className="flex items-center gap-1">
                    <FaBed /> <span>{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaBath /> <span>{property.bathrooms} Bathrooms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaRulerCombined /> <span>{property.squareFeet} sqft</span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-6 text-gray-700 text-sm md:text-base leading-relaxed">
                  {property.description}
                </p>

                {/* Features */}
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-purple-800">Features</h3>
                  {property.features && property.features.length > 0 ? (
                    <ul className="list-disc ml-6 mt-2 text-gray-700 text-sm md:text-base">
                      {property.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 mt-1 text-sm">No features listed.</p>
                  )}
                </div>
              </div>

              {/* Book Now Button */}
              <div className="mt-8">
                <button
                  onClick={() => navigate(`/bookings/${property.id}`)}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
                >
                  Book Your Dream Home Now!
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {property && (
        <Chat 
          recipient={property.realtor}
          propertyId={property.id}
        />
      )}
    </>
  );
};

export default PropertyDetails;
