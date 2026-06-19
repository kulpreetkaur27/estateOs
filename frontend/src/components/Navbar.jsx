import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, NavLink } from 'react-router-dom';
import { FaCog, FaSignOutAlt, FaEye } from 'react-icons/fa';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the user from localStorage and set the state
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Close the dropdown if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear user data from localStorage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // Construct the full image URL dynamically
  const profilePictureUrl = user ? `${user.profilePicture}` : '/uploads/default-profile.jpg';

  const handleBookingsClick = () => {
    // Navigate to the bookings page if the user is a client
    if (user?.role === 'CLIENT') {
      navigate('/bookings');  // Assuming your bookings page route is `/bookings`
    }
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <NavLink className="navbar-brand" to="/" style={{ paddingLeft: "1rem" }}>
          <img
            src="../logo.png"
            width={70}
            alt="Company Logo"
            className="custom-logo"
          />
        </NavLink>
        <div className="hidden md:flex space-x-8">
          <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</a>
          <a href="/about-us" className="text-gray-600 hover:text-gray-900 transition-colors">About Us</a>
          <a href="/contact-us" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a>
        </div>
        <div>
          {user ? (
            <div className="relative inline-block text-left" ref={dropdownRef}>
              {/* Profile button with user image */}
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none"
              >
                {/* Display user's profile picture or fallback to default */}
                <img 
                  src={profilePictureUrl}  // Use the dynamically constructed profile picture URL
                  alt="User Profile" 
                  width={60}
                  className="rounded-full object-cover"
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50"
                >
                  <div className="py-1">
                    <button 
                      onClick={() => { navigate('/user-settings'); setDropdownOpen(false); }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                    >
                      <FaCog className="mr-2" />
                      Settings
                    </button>
                    
                    {user.role === 'CLIENT' && (
                      <button 
                        onClick={handleBookingsClick}
                        className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 w-full"
                      >
                        <FaEye className="mr-2" />
                        View Bookings
                      </button>
                    )}
                    <button 
                      onClick={() => { handleLogout(); setDropdownOpen(false); }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100 w-full"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="ml-4 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
