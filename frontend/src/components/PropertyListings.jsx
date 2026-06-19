// PropertyListings.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaHeart,
  FaRegHeart,
  FaFilter,
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';
import Navbar from './Navbar';

const GET_PROPERTIES = gql`
  query GetAllProperties($filter: PropertyFilterInput) {
    getAllProperties(filter: $filter) {
      id
      title
      description
      price
      location
      bedrooms
      bathrooms
      propertyType
      squareFeet
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

const GET_LOCATIONS = gql`
  query GetUniqueLocations {
    getUniqueLocations
  }
`;

const PropertyListings = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  // New state for sorting – default to "newest"
  const [sortOption, setSortOption] = useState("newest");

  // Pass the sort option along with any filters
  const { loading, error, data, refetch } = useQuery(GET_PROPERTIES, {
    variables: { filter: { ...filter, sort: sortOption } },
  });
  const { data: locationData } = useQuery(GET_LOCATIONS);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prevFavorites) =>
      prevFavorites.includes(id)
        ? prevFavorites.filter((favId) => favId !== id)
        : [...prevFavorites, id]
    );
  };

  // When applying filters, pass along the current sort option
  const applyFilter = () => {
    refetch({ filter: { ...filter, sort: sortOption } });
    setShowFilter(false);
  };

  const clearFilters = () => {
    setFilter({});
    refetch({ filter: { sort: sortOption } });
  };

  // Remove an individual filter key and update the query
  const clearFilter = (key) => {
    const newFilter = { ...filter };
    delete newFilter[key];
    setFilter(newFilter);
    refetch({ filter: { ...newFilter, sort: sortOption } });
  };

  // Helper function to render filter chips
  const renderFilterChip = (key, value) => {
    let label = '';
    switch (key) {
      case 'propertyType':
        label = `Type: ${value[0] + value.slice(1).toLowerCase()}`;
        break;
      case 'minPrice':
        label = `Min Price: $${value}`;
        break;
      case 'maxPrice':
        label = `Max Price: $${value}`;
        break;
      case 'bedrooms':
        label = `Bedrooms: ${value}`;
        break;
      case 'bathrooms':
        label = `Bathrooms: ${value}`;
        break;
      default:
        label = `${key}: ${value}`;
    }
    return (
      <div
        key={key}
        className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
      >
        <span>{label}</span>
        <button onClick={() => clearFilter(key)} className="ml-1 hover:text-blue-500">
          <FaTimes />
        </button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">View all properties</h1>
              <p className="mt-2 text-gray-600">You can sort and filter</p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              {/* Sorting Dropdown */}
              <div className="flex items-center gap-1">
                <label className="text-gray-700 font-medium">Sort by:</label>
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    // Immediately refetch with new sort option along with existing filters
                    refetch({ filter: { ...filter, sort: e.target.value } });
                  }}
                  className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highestPrice">Highest Price</option>
                  <option value="lowestPrice">Lowest Price</option>
                </select>
              </div>
              <button
                onClick={clearFilters}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilter(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
              >
                <FaFilter className="mr-2" /> Filter
              </button>
            </div>
          </div>

          {/* Display applied filters as chips */}
          {Object.keys(filter).length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Applied Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filter).map(([key, value]) =>
                  value !== undefined && renderFilterChip(key, value)
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center mt-4">
              <FaSpinner className="animate-spin mr-2 text-gray-600" size={24} />
              <p className="text-center text-gray-600">Loading...</p>
            </div>
          )}
          {error && (
            <p className="text-center text-red-500 mt-4">Error loading properties!</p>
          )}

          {!loading && !error && data?.getAllProperties?.length > 0 && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.getAllProperties.map((property) => (
                <div
                  key={property.id}
                  className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 p-4"
                >
                  {/* Favorite Icon */}
                  <button
                    onClick={() => toggleFavorite(property.id)}
                    className="absolute top-4 right-4 text-2xl"
                  >
                    {favorites.includes(property.id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart className="text-gray-400 hover:text-red-500 transition duration-300" />
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
                    className="w-full h-40 object-cover rounded-lg"
                  />

                  <h2 className="mt-4 text-xl font-semibold text-gray-800">{property.title}</h2>
                  <p className="text-gray-600">{property.location}</p>
                  <p className="text-lg font-bold text-purple-600">${property.price}</p>

                  {/* Property Details */}
                  <div className="flex justify-between items-center mt-3 text-gray-700">
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

                  {/* Navigate to Property Details Page */}
                  <button
                    onClick={() => navigate(`/property-details/${property.id}`)}
                    className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition duration-300"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Popup UI */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Filter Properties</h2>
              <button
                onClick={() => setShowFilter(false)}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close Filter"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Property Type */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="propertyType"
                >
                  Property Type
                </label>
                <select
                  id="propertyType"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter.propertyType || ""}
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      propertyType: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Any</option>
                  <option value="HOUSE">House</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="CONDO">Condo</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="minPrice"
                >
                  Min Price: {filter.minPrice !== undefined ? `$${filter.minPrice}` : 'Any'}
                </label>
                <input
                  id="minPrice"
                  type="range"
                  min="0"
                  max="10000"
                  value={filter.minPrice !== undefined ? filter.minPrice : 0}
                  className="w-full"
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      minPrice: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="maxPrice"
                >
                  Max Price: {filter.maxPrice !== undefined ? `$${filter.maxPrice}` : 'Any'}
                </label>
                <input
                  id="maxPrice"
                  type="range"
                  min="0"
                  max="10000"
                  value={filter.maxPrice !== undefined ? filter.maxPrice : 10000}
                  className="w-full"
                  onChange={(e) =>
                    setFilter({
                      ...filter,
                      maxPrice: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="bedrooms"
                >
                  Bedrooms: {filter.bedrooms !== undefined ? filter.bedrooms : 'Any'}
                </label>
                <input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={filter.bedrooms !== undefined ? filter.bedrooms : ''}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || parseInt(value, 10) === 0) {
                      const newFilter = { ...filter };
                      delete newFilter.bedrooms;
                      setFilter(newFilter);
                    } else {
                      setFilter({ ...filter, bedrooms: parseInt(value, 10) });
                    }
                  }}
                />
              </div>

              {/* Bathrooms */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="bathrooms"
                >
                  Bathrooms: {filter.bathrooms !== undefined ? filter.bathrooms : 'Any'}
                </label>
                <input
                  id="bathrooms"
                  type="number"
                  min="0"
                  value={filter.bathrooms !== undefined ? filter.bathrooms : ''}
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || parseInt(value, 10) === 0) {
                      const newFilter = { ...filter };
                      delete newFilter.bathrooms;
                      setFilter(newFilter);
                    } else {
                      setFilter({ ...filter, bathrooms: parseInt(value, 10) });
                    }
                  }}
                />
              </div>
            </div>

            <button
              onClick={applyFilter}
              className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition duration-300"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyListings;
