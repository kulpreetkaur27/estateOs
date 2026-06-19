import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import Navbar from './Navbar';
import { FaArrowRight, FaImage } from 'react-icons/fa';

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!, $profilePicture: Upload) {
    updateUser(id: $id, input: $input, profilePicture: $profilePicture) {
      id
      firstName
      lastName
      phoneNumber
      gender
      email
      profilePicture
    }
  }
`;

// Phone number regex for format (xxx)-xxx-xxxx
const phoneRegex = /^\(\d{3}\)-\d{3}-\d{4}$/;

const UserSettings = () => {
  const [user, setUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profilePicture: null,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Mutation for updating user data
  const [updateUser] = useMutation(UPDATE_USER);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUpdatedUser({
        firstName: parsedUser.firstName,
        lastName: parsedUser.lastName,
        phoneNumber: parsedUser.phoneNumber,
        profilePicture: parsedUser.profilePicture,
      });
    }
  }, []);

  const profilePictureUrl = user
    ? `${user.profilePicture}`
    : '/uploads/default-profile.jpg';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">No user data available. Please log in.</p>
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    if (!phoneRegex.test(updatedUser.phoneNumber)) {
      return setError('Phone number must be in the format (xxx)-xxx-xxxx.');
    }

    // Build the variables object without the profilePicture, if not a file
    const variables = {
      id: user.id,
      input: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
      },
    };

    if (updatedUser.profilePicture instanceof File) {
      variables.profilePicture = updatedUser.profilePicture;
    }

    try {
      const { data } = await updateUser({ variables });
      setUser(data.updateUser);
      localStorage.setItem('user', JSON.stringify(data.updateUser));
      alert('User information updated successfully!');
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUpdatedUser((prevState) => ({
      ...prevState,
      profilePicture: file,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted += '(' + digits.substring(0, 3);
    }
    if (digits.length >= 3) {
      formatted += ')-' + digits.substring(3, 6);
    }
    if (digits.length >= 6) {
      formatted += '-' + digits.substring(6, 10);
    }
    return formatted;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
        <div className="bg-white shadow-lg rounded-lg w-full max-w-4xl p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">User Settings</h1>
          <form onSubmit={handleUpdate} className="space-y-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-300 rounded-lg">
                {error}
              </div>
            )}
            {/* Profile Picture */}

            <div className="flex items-center justify-center">
              {updatedUser.profilePicture ? (
                updatedUser.profilePicture instanceof File ? (
                  <div className="flex items-center gap-4">
                    {/* Current Profile Image */}
                    <div className="flex flex-col items-center">
                      <FaImage className="mb-1 text-gray-600" size={18} />
                      <span className="text-xs text-gray-500">Current Profile</span>
                      <img
                        src={profilePictureUrl}
                        alt="Current Profile"
                        className="w-20 h-20 rounded-full object-cover mt-2"
                      />
                    </div>
                    {/* Arrow */}
                    <FaArrowRight className="text-gray-600" size={24} />
                    {/* Preview (New) Image */}
                    <div className="flex flex-col items-center">
                      <FaImage className="mb-1 text-gray-600" size={18} />
                      <span className="text-xs text-gray-500">New Preview</span>
                      <img
                        src={URL.createObjectURL(updatedUser.profilePicture)}
                        alt="Profile Preview"
                        className="w-20 h-20 rounded-full object-cover mt-2"
                      />
                    </div>
                  </div>
                ) : (
                  // Otherwise, show only the current profile image (string URL)
                  <div className="flex flex-col items-center">
                    <FaImage className="mb-1 text-gray-600" size={18} />
                    <span className="text-xs text-gray-500">Current Profile</span>
                    <img
                      src={profilePictureUrl}
                      alt="Current Profile"
                      className="w-20 h-20 rounded-full object-cover mt-2"
                    />
                  </div>
                )
              ) : null}
            </div>

            {/* Row 1: First Name, Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={updatedUser.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                />
              </div>

              <div>
                <label className="block text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={updatedUser.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Row 2: Phone Number, Profile Picture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={updatedUser.phoneNumber}
                  onChange={(e) =>
                    setUpdatedUser({ ...updatedUser, phoneNumber: formatPhoneNumber(e.target.value) })
                  }
                  placeholder="(xxx)-xxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-gray-700">Profile Picture</label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Row 3: Email, Gender (read-only) */}
           {/* Row 3: Email, Gender (read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700">Email Address</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"
                  value={user.email}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is your registered email and cannot be changed.
                </p>
              </div>
              <div>
                <label className="block text-gray-700">Gender</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg bg-gray-200 cursor-not-allowed"
                  value={user.gender}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is your registered gender and cannot be changed.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 text-center">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UserSettings;