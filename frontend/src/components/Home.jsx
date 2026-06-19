import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaRegHeart } from 'react-icons/fa';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Navbar from './Navbar';

// GraphQL Query to Fetch Properties
const GET_PROPERTIES = gql`
  query {
    getAllProperties {
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
        firstName
        lastName
        profilePicture
      }
      images
      createdAt
    }
  }
`;

const Home = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  // Fetch properties using Apollo Client
  const { loading, error, data } = useQuery(GET_PROPERTIES);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      navigate(parsedUser.role === 'REALTOR' ? '/realtor-dashboard' : '/');
    }
  }, []);


  const toggleFavorite = (id) => {
    setFavorites((prevFavorites) =>
      prevFavorites.includes(id)
        ? prevFavorites.filter((favId) => favId !== id)
        : [...prevFavorites, id]
    );
  };

  // Slider images array with text overlay
  const sliderImages = [
    {
      url: 'https://images.unsplash.com/photo-1592595896551-12b371d546d5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'Discover Your Dream Home',
    },
    {
      url: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'Luxury Living Awaits',
    },
    {
      url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      text: 'Find the Perfect Place',
    },
  ];

  // Settings for react-slick slider
  const sliderSettings = {
    dots: true,
    infinite: true,
    fade: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
  };

  return (
    // Added overflow-x-hidden wrapper to prevent horizontal scrolling
    <div className="overflow-x-hidden">
      <Navbar />

      {/* Slider Banner */}
      <div className="container mx-auto mt-20 px-4">
        <Slider {...sliderSettings}>
          {sliderImages.map((slide, index) => (
            <div key={index} className="relative">
              <img
                src={slide.url}
                alt={`slide-${index}`}
                className="w-full h-80 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-70 rounded-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-white text-4xl font-extrabold drop-shadow-lg">
                  {slide.text}
                </h2>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Main Content */}
      <div className="min-h-screen py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-8">
            {user ? (
              console.log("userHome", user),
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800">
                  Welcome, {user.firstName} {user.lastName}!
                </h1>
                <p className="mt-3 text-lg text-gray-600">We're thrilled to have you back.</p>
              </div>
            ) : (
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800">
                  Welcome to Our Real Estate Platform!
                </h1>
                <p className="mt-3 text-lg text-gray-600">Please log in to continue.</p>
              </div>
            )}

            {/* Loading Animation */}
            {loading && (
              <div className="flex justify-center mt-8">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Error Handling */}
            {error && (
              <p className="text-center text-red-500 mt-8">
                Error loading properties!
              </p>
            )}

            {/* Property Listings */}
            {!loading && !error && data?.getAllProperties?.slice(0, 3).length > 0 && (
              <>
                {/* View More Link */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => navigate('/property-listings')}
                    className="text-purple-600 font-semibold text-lg hover:underline transition duration-300"
                  >
                    View More &gt;&gt;
                  </button>
                </div>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {data.getAllProperties.slice(0, 3).map((property) => (
                    <div
                      key={property.id}
                      className="relative bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 p-5 transform hover:scale-105"
                    >
                      {/* Favorite Icon */}
                      <button
                        onClick={() => toggleFavorite(property.id)}
                        className="absolute top-4 right-4 text-2xl focus:outline-none"
                      >
                        {favorites.includes(property.id) ? (
                          <FaHeart className="text-red-500" />
                        ) : (
                          <FaRegHeart className="text-gray-400 hover:text-red-500 transition-colors duration-300" />
                        )}
                      </button>

                      <img
                        src={
                          property.images &&
                          property.images[0]
                            ? `${property.images[0]}`
                            : 'https://placehold.co/300x200'
                        }
                        alt={property.title}
                        className="w-full h-48 object-cover rounded-md"
                      />

                      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                        {property.title}
                      </h2>
                      <p className="text-gray-600 mt-1">{property.location}</p>
                      <p className="text-xl font-bold text-purple-600 mt-2">${property.price}</p>

                      {/* Property Details */}
                      <div className="flex justify-between items-center mt-4 text-gray-700">
                        <div className="flex items-center gap-1">
                          <FaBed className="text-gray-500" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaBath className="text-gray-500" />
                          <span>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRulerCombined className="text-gray-500" />
                          <span>{property.squareFeet}+ sqft</span>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">Realtor:</span>
                        <div className="inline-flex items-center gap-2">
                          <span>
                            {property.realtor?.firstName} {property.realtor?.lastName}
                          </span>
                          {property.realtor?.profilePicture && (
                            <img
                              src={`${property.realtor.profilePicture}`}
                              alt="Realtor"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                        </div>
                      </p>

                      {/* View Details Button */}
                      <button
                        className="mt-6 w-full px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-transform duration-300 transform hover:scale-105 focus:outline-none"
                        onClick={() => navigate(`/property-details/${property.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
