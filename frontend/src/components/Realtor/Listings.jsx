// ListingsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { FaTh, FaList, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { ThemeContext } from './ThemeContext';
import RealtorChat from './RealtorChat';

// Existing queries
const GET_PROPERTIES = gql`
  query GetProperties($filter: PropertyFilterInput) {
    getAllProperties(filter: $filter) {
      id
      title
      description
      location
      price
      images
      bedrooms
      bathrooms
      propertyType
      squareFeet
      furnished
      hasParking
      features
      realtor {
        id
      }
      createdAt
    }
  }
`;

const GET_BOOKINGS = gql`
  query GetBookings($realtorId: ID!) {
    getBookings(realtorId: $realtorId) {
      id
      date
      startTime
      endTime
      mode
      status
      property {
        id
        title
        location
        price
        images
      }
    }
  }
`;

// Updated mutations for adding and editing properties
const ADD_PROPERTY = gql`
  mutation AddProperty(
    $title: String!
    $description: String!
    $price: Float!
    $location: String!
    $bedrooms: Int!
    $bathrooms: Int!
    $propertyType: String!
    $squareFeet: Int!
    $furnished: Boolean
    $hasParking: Boolean
    $features: [String]
    $realtor: ID!
    $images: [Upload]
  ) {
    addProperty(
      title: $title
      description: $description
      price: $price
      location: $location
      bedrooms: $bedrooms
      bathrooms: $bathrooms
      propertyType: $propertyType
      squareFeet: $squareFeet
      furnished: $furnished
      hasParking: $hasParking
      features: $features
      realtor: $realtor
      images: $images
    ) {
      id
      title
      location
      price
      images
      realtor {
        id
      }
    }
  }
`;

const UPDATE_PROPERTY = gql`
  mutation UpdateProperty(
    $id: ID!
    $title: String
    $description: String
    $price: Float
    $location: String
    $bedrooms: Int
    $bathrooms: Int
    $propertyType: String
    $squareFeet: Int
    $furnished: Boolean
    $hasParking: Boolean
    $features: [String]
    $images: [Upload]
  ) {
    updateProperty(
      id: $id
      title: $title
      description: $description
      price: $price
      location: $location
      bedrooms: $bedrooms
      bathrooms: $bathrooms
      propertyType: $propertyType
      squareFeet: $squareFeet
      furnished: $furnished
      hasParking: $hasParking
      features: $features
      images: $images
    ) {
      id
      title
      location
      price
      images
      realtor {
        id
      }
    }
  }
`;

// New mutation for archiving a property (previously named deleteProperty)
const DELETE_PROPERTY = gql`
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id)
  }
`;

// Define an initial form state constant
const initialFormState = {
  id: '',
  title: '',
  description: '',
  price: '',
  location: '',
  bedrooms: '',
  bathrooms: '',
  propertyType: '',
  squareFeet: '',
  furnished: false,
  hasParking: false,
  features: '',
};

const ListingsPage = () => {
  const [activeTab, setActiveTab] = useState('properties');
  const [listings, setListings] = useState([]);
  const [viewType, setViewType] = useState('card');
  const { themeClasses } = useContext(ThemeContext);

  // Modal and form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // New state for delete confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [propertyToArchive, setPropertyToArchive] = useState(null);

  const [formState, setFormState] = useState(initialFormState);
  // New state for file uploads
  const [imageFiles, setImageFiles] = useState([]);

  const storedUser = localStorage.getItem('user');
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  const loggedInRealtorId = loggedInUser ? loggedInUser.id : null;

  const { data, loading, error } = useQuery(GET_PROPERTIES);
  useEffect(() => {
    if (data && data.getAllProperties) {
      const fetchedListings = data.getAllProperties.map((item) => ({
        id: item.id,
        property: item.title,
        description: item.description,
        location: item.location,
        images: item.images,
        price: `$${Number(item.price).toLocaleString()}`,
        realtor: item.realtor.id,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        propertyType: item.propertyType,
        squareFeet: item.squareFeet,
        furnished: item.furnished,
        hasParking: item.hasParking,
        features: item.features,
      }));
      setListings(fetchedListings);
    }
  }, [data]);

  const realtorProperties = listings.filter(
    (listing) => listing.realtor === loggedInRealtorId
  );

  const {
    data: bookingData,
    loading: bookingLoading,
    error: bookingError,
  } = useQuery(GET_BOOKINGS, {
    variables: { realtorId: loggedInRealtorId },
    skip: !loggedInRealtorId,
  });

  const [addPropertyMutation, { loading: addLoading, error: addError }] = useMutation(ADD_PROPERTY);
  const [updatePropertyMutation, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_PROPERTY);
  const [deletePropertyMutation, { loading: deleteLoading, error: deleteError }] = useMutation(DELETE_PROPERTY);

  // Handler for file input change
  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  // Function to reset the form state and clear files
  const resetForm = () => {
    setFormState(initialFormState);
    setImageFiles([]);
  };

  // Handler for adding a new property
  const handleAddProperty = async (e) => {
    e.preventDefault();
    try {
      const featuresArray = formState.features.split(',').map(f => f.trim()).filter(Boolean);
      const response = await addPropertyMutation({
        variables: {
          title: formState.title,
          description: formState.description,
          price: parseFloat(formState.price),
          location: formState.location,
          bedrooms: parseInt(formState.bedrooms),
          bathrooms: parseInt(formState.bathrooms),
          propertyType: formState.propertyType,
          squareFeet: parseInt(formState.squareFeet),
          furnished: formState.furnished,
          hasParking: formState.hasParking,
          features: featuresArray,
          realtor: loggedInRealtorId,
          images: imageFiles.length ? imageFiles : [],
        },
      });
      const newProperty = response.data.addProperty;
      setListings(prev => [
        ...prev,
        {
          id: newProperty.id,
          property: newProperty.title,
          description: formState.description,
          location: newProperty.location,
          images: newProperty.images,
          price: `$${Number(newProperty.price).toLocaleString()}`,
          realtor: newProperty.realtor.id,
          bedrooms: formState.bedrooms,
          bathrooms: formState.bathrooms,
          propertyType: formState.propertyType,
          squareFeet: formState.squareFeet,
          furnished: formState.furnished,
          hasParking: formState.hasParking,
          features: featuresArray,
        },
      ]);
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler for editing an existing property
  // Handler for editing an existing property
const handleEditProperty = async (e) => {
  e.preventDefault();
  try {
    const featuresArray = formState.features.split(',').map(f => f.trim()).filter(Boolean);
    // Build the mutation variables without the images key
    const mutationVariables = {
      id: formState.id,
      title: formState.title,
      description: formState.description,
      price: parseFloat(formState.price),
      location: formState.location,
      bedrooms: parseInt(formState.bedrooms),
      bathrooms: parseInt(formState.bathrooms),
      propertyType: formState.propertyType,
      squareFeet: parseInt(formState.squareFeet),
      furnished: formState.furnished,
      hasParking: formState.hasParking,
      features: featuresArray,
    };

    // Only include images if new files have been selected
    if (imageFiles.length > 0) {
      mutationVariables.images = imageFiles;
    }
    
    const response = await updatePropertyMutation({
      variables: mutationVariables,
    });
    const updated = response.data.updateProperty;
    setListings(prev =>
      prev.map(prop =>
        prop.id === updated.id
          ? {
              ...prop,
              property: updated.title,
              location: updated.location,
              images: updated.images, // This remains unchanged if no new image was provided
              price: `$${Number(updated.price).toLocaleString()}`,
              description: formState.description,
              bedrooms: formState.bedrooms,
              bathrooms: formState.bathrooms,
              propertyType: formState.propertyType,
              squareFeet: formState.squareFeet,
              furnished: formState.furnished,
              hasParking: formState.hasParking,
              features: featuresArray,
            }
          : prop
      )
    );
    resetForm();
    setShowEditModal(false);
  } catch (err) {
    console.error(err);
  }
};


  // Opens the custom archive confirm modal
  const openArchiveModal = (id) => {
    setPropertyToArchive(id);
    setShowConfirmModal(true);
  };

  // Called when user confirms deletion (archiving)
  const confirmArchive = async () => {
    try {
      await deletePropertyMutation({ variables: { id: propertyToArchive } });
      setListings(prev => prev.filter(property => property.id !== propertyToArchive));
      setShowConfirmModal(false);
      setPropertyToArchive(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Open the edit modal and pre-fill form with property data
  const openEditModal = (property) => {
    setFormState({
      id: property.id,
      title: property.property,
      description: property.description || '',
      price: property.price.replace(/[^0-9.-]+/g, ''),
      location: property.location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.propertyType,
      squareFeet: property.squareFeet,
      furnished: property.furnished,
      hasParking: property.hasParking,
      features: property.features ? property.features.join(', ') : '',
    });
    setImageFiles([]);
    setShowEditModal(true);
  };

  const renderViewToggle = () => (
    <div className="flex justify-end mb-4">
      <div className="flex space-x-2">
        <button
          onClick={() => setViewType('card')}
          className={`px-3 py-1 border rounded-md focus:outline-none transition-colors duration-200 ${
            viewType === 'card'
              ? `${themeClasses.primaryBg} text-white`
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <FaTh className="inline mr-1" /> Card
        </button>
        <button
          onClick={() => setViewType('table')}
          className={`px-3 py-1 border rounded-md focus:outline-none transition-colors duration-200 ${
            viewType === 'table'
              ? `${themeClasses.primaryBg} text-white`
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <FaList className="inline mr-1" /> Table
        </button>
      </div>
    </div>
  );

  // Updated modal component for Add/Edit Property with two-column layout and validations
  const renderAddEditModal = (isEdit = false) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg w-11/12 md:w-1/2 p-6 max-h-screen overflow-y-auto">
        <h3 className="text-2xl font-semibold mb-4">
          {isEdit ? 'Edit Property' : 'Add Property'}
        </h3>
        <form onSubmit={isEdit ? handleEditProperty : handleAddProperty}>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title"
              value={formState.title}
              onChange={(e) =>
                setFormState({ ...formState, title: e.target.value })
              }
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={formState.price}
              onChange={(e) =>
                setFormState({ ...formState, price: e.target.value })
              }
              onInput={(e) =>
                (e.target.value = e.target.value.replace(/[^0-9.]/g, ''))
              }
              className="border p-2 rounded"
              required
            />
            <textarea
              placeholder="Description"
              value={formState.description}
              onChange={(e) =>
                setFormState({ ...formState, description: e.target.value })
              }
              className="border p-2 rounded col-span-2"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={formState.location}
              onChange={(e) =>
                setFormState({ ...formState, location: e.target.value })
              }
              className="border p-2 rounded"
              required
            />
            <select
              value={formState.propertyType}
              onChange={(e) =>
                setFormState({ ...formState, propertyType: e.target.value })
              }
              className="border p-2 rounded"
              required
            >
              <option value="" disabled>
                Select property type
              </option>
              <option value="HOUSE">HOUSE</option>
              <option value="APARTMENT">APARTMENT</option>
              <option value="CONDO">CONDO</option>
              <option value="TOWNHOUSE">TOWNHOUSE</option>
            </select>
            <input
              type="number"
              placeholder="Bedrooms"
              value={formState.bedrooms}
              onChange={(e) =>
                setFormState({ ...formState, bedrooms: e.target.value })
              }
              onInput={(e) =>
                (e.target.value = e.target.value.replace(/[^0-9]/g, ''))
              }
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Bathrooms"
              value={formState.bathrooms}
              onChange={(e) =>
                setFormState({ ...formState, bathrooms: e.target.value })
              }
              onInput={(e) =>
                (e.target.value = e.target.value.replace(/[^0-9]/g, ''))
              }
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Square Feet"
              value={formState.squareFeet}
              onChange={(e) =>
                setFormState({ ...formState, squareFeet: e.target.value })
              }
              onInput={(e) =>
                (e.target.value = e.target.value.replace(/[^0-9]/g, ''))
              }
              className="border p-2 rounded"
              required
            />
            <div className="flex items-center space-x-4 col-span-2">
              <div className="flex items-center">
                <label className="mr-2">Furnished:</label>
                <input
                  type="checkbox"
                  checked={formState.furnished}
                  onChange={(e) =>
                    setFormState({ ...formState, furnished: e.target.checked })
                  }
                />
              </div>
              <div className="flex items-center">
                <label className="mr-2">Has Parking:</label>
                <input
                  type="checkbox"
                  checked={formState.hasParking}
                  onChange={(e) =>
                    setFormState({ ...formState, hasParking: e.target.checked })
                  }
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Features (comma separated)"
              value={formState.features}
              onChange={(e) =>
                setFormState({ ...formState, features: e.target.value })
              }
              className="border p-2 rounded col-span-2"
            />
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="border p-2 rounded col-span-2"
            />
          </div>
          <div className="mt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                isEdit ? setShowEditModal(false) : setShowAddModal(false);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEdit ? updateLoading : addLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              {isEdit ? (updateLoading ? 'Saving...' : 'Save Changes') : (addLoading ? 'Adding...' : 'Add Property')}
            </button>
          </div>
        </form>
        {(addError || updateError) && (
          <div className="mt-2 text-red-500">
            {addError?.message || updateError?.message}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">Listings</h2>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('properties')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'properties'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Properties
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'bookings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Booked Properties
          </button>
        </nav>
      </div>

      {activeTab === 'properties' && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            {renderViewToggle()}
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
            >
              <FaPlus className="mr-2" /> Add Property
            </button>
          </div>
          {loading ? (
            <div className="text-center text-gray-500">Loading properties...</div>
          ) : error ? (
            <div className="text-center text-red-500">
              Error loading properties: {error.message}
            </div>
          ) : viewType === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Property
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Location
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Price
                    </th>
                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {realtorProperties.map((listing) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-800 flex items-center">
                        <img
                          src={
                            listing.images && listing.images[0]
                              ? `${listing.images[0]}`
                              : 'https://placehold.co/300x200'
                          }
                          alt={listing.property}
                          className="h-16 w-16 object-cover rounded-md mr-4"
                        />
                        {listing.property}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        {listing.location}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800">
                        {listing.price}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-800 flex space-x-2">
                        <button
                          onClick={() => openEditModal(listing)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => openArchiveModal(listing.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 flex items-center"
                        >
                          <FaTrash className="mr-1" /> Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {realtorProperties.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-gray-50 border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 relative"
                >
                  <img
                    src={
                      listing.images && listing.images[0]
                        ? `${listing.images[0]}`
                        : 'https://placehold.co/300x200'
                    }
                    alt={listing.property}
                    className="h-40 w-full object-cover rounded-md mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {listing.property}
                  </h3>
                  <p className="text-gray-600">{listing.location}</p>
                  <p className="text-gray-800 font-medium mt-2">
                    {listing.price}
                  </p>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => openEditModal(listing)}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => openArchiveModal(listing.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 flex items-center"
                    >
                      <FaTrash className="mr-1" /> Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white shadow-lg rounded-lg p-6">
          {renderViewToggle()}
          {bookingLoading ? (
            <div className="text-center text-gray-500">Loading bookings...</div>
          ) : bookingError ? (
            <div className="text-center text-red-500">
              Error loading bookings: {bookingError.message}
            </div>
          ) : bookingData &&
            bookingData.getBookings &&
            bookingData.getBookings.length > 0 ? (
            viewType === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                        Property
                      </th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                        Location
                      </th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                        Price
                      </th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                        Booking Date
                      </th>
                      <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingData.getBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="py-4 px-6 text-sm font-medium text-gray-800 flex items-center">
                          <img
                            src={
                              booking.property.images &&
                              booking.property.images[0]
                                ? `${booking.property.images[0]}`
                                : 'https://placehold.co/300x200'
                            }
                            alt={booking.property.title}
                            className="h-16 w-16 object-cover rounded-md mr-4"
                          />
                          {booking.property.title}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-800">
                          {booking.property.location}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-800">
                          ${Number(booking.property.price).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-800">
                          {new Date(booking.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-800">
                          {booking.startTime} - {booking.endTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {bookingData.getBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-gray-50 border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200"
                  >
                    <img
                      src={
                        booking.property.images &&
                        booking.property.images[0]
                          ? `${booking.property.images[0]}`
                          : 'https://placehold.co/300x200'
                      }
                      alt={booking.property.title}
                      className="h-40 w-full object-cover rounded-md mb-4"
                    />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {booking.property.title}
                    </h3>
                    <p className="text-gray-600">{booking.property.location}</p>
                    <p className="text-gray-800 font-medium mt-2">
                      ${Number(booking.property.price).toLocaleString()}
                    </p>
                    <p className="text-gray-500 mt-2">
                      {new Date(booking.date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500">
                      {booking.startTime} - {booking.endTime}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center text-gray-500">No bookings found.</div>
          )}
        </div>
      )}

      {/* Render the add/edit modals */}
      {showAddModal && renderAddEditModal(false)}
      {showEditModal && renderAddEditModal(true)}

      {/* Custom confirmation modal for archiving a property */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg w-11/12 md:w-1/3 p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Confirm Archive</h3>
            <p className="mb-6">Are you sure you want to archive this property?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
      <RealtorChat />
    </div>
  );
};

export default ListingsPage;
