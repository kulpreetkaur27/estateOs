import React, { useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaList,
  FaUsers,
  FaCalendarAlt,
  FaCogs,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { ThemeContext } from './ThemeContext';

const Layout = () => {
  const [user, setUser] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, changeTheme, themeClasses } = useContext(ThemeContext);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Helper to create full profile picture URL
  const profilePictureUrl = user
    ? `${user.profilePicture}`
    : '/uploads/default-profile.jpg';

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // Enhanced Theme Toggler with color swatches
  const renderThemeToggler = () => {
    const availableThemes = [
      { key: 'purple', label: 'Purple', className: 'bg-purple-600' },
      { key: 'pink', label: 'Pink', className: 'bg-pink-600' },
      { key: 'black', label: 'Black', className: 'bg-black' },
      { key: 'navy', label: 'Navy Blue', className: 'bg-blue-900' },
    ];

    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-700 font-medium">Theme:</span>
        {availableThemes.map((item) => (
          <button
            key={item.key}
            onClick={() => changeTheme(item.key)}
            className={`rounded-full focus:outline-none transition transform duration-300 ${
              theme === item.key
                ? 'w-10 h-10 scale-110 ring-4 ring-offset-2 ring-white shadow-lg'
                : 'w-8 h-8'
            } ${item.className}`}
            title={item.label}
          />
        ))}
      </div>
    );
  };

  // Active menu styling
  const activeLinkClasses =
    'bg-white/30 border-l-4 border-white font-bold text-white';
  const inactiveLinkClasses =
    'hover:bg-white/10 transition-colors duration-300';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`flex flex-col justify-between ${themeClasses.primaryBg} p-4 text-white transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-full md:w-64'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            {!isCollapsed && (
              <h2 className="text-3xl font-bold text-white">
                Realtor Dashboard
              </h2>
            )}
            <button onClick={toggleSidebar} className="text-white focus:outline-none">
              {isCollapsed ? <FaChevronRight size={20} /> : <FaChevronLeft size={20} />}
            </button>
          </div>
          <ul>
            <li className="mb-4">
              <NavLink
                to="/realtor-dashboard"
                className={({ isActive }) =>
                  `flex items-center text-lg p-2 rounded-md transition-colors duration-300 ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
              >
                <FaHome className="mr-4" size={20} />
                {!isCollapsed && 'Dashboard'}
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink
                to="/realtor-portal/listings"
                className={({ isActive }) =>
                  `flex items-center text-lg p-2 rounded-md transition-colors duration-300 ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
              >
                <FaList className="mr-4" size={20} />
                {!isCollapsed && 'Listings'}
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink
                to="/realtor-portal/clients"
                className={({ isActive }) =>
                  `flex items-center text-lg p-2 rounded-md transition-colors duration-300 ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
              >
                <FaUsers className="mr-4" size={20} />
                {!isCollapsed && 'Client Bookings'}
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink
                to="/realtor-portal/appointments"
                className={({ isActive }) =>
                  `flex items-center text-lg p-2 rounded-md transition-colors duration-300 ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
              >
                <FaCalendarAlt className="mr-4" size={20} />
                {!isCollapsed && 'Appointments'}
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink
                to="/realtor-portal/settings"
                className={({ isActive }) =>
                  `flex items-center text-lg p-2 rounded-md transition-colors duration-300 ${
                    isActive ? activeLinkClasses : inactiveLinkClasses
                  }`
                }
              >
                <FaCogs className="mr-4" size={20} />
                {!isCollapsed && 'Settings'}
              </NavLink>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto bg-white transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={profilePictureUrl}
              alt="Realtor Profile"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName} {user.lastName}!
              </h1>
              <p className="text-gray-500">Here's your dashboard overview.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {renderThemeToggler()}
            <button
              className={`${themeClasses.primaryBg} text-white px-4 py-2 rounded-lg ${themeClasses.primaryHover} transition-colors duration-300`}
              onClick={() => navigate('/profile')}
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="transition-all duration-500 ease-in-out">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;