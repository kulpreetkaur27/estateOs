import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { useNavigate, NavLink } from 'react-router-dom';

// Updated mutation to accept a separate profilePicture parameter
const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!, $profilePicture: Upload) {
    createUser(input: $input, profilePicture: $profilePicture) {
      id
      firstName
      lastName
      gender
      phoneNumber
      email
      role
      createdAt
      profilePicture
    }
  }
`;

const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        firstName
        lastName
        email
        role
        gender
        phoneNumber
        profilePicture
        createdAt
      }
    }
  }
`;

const phoneRegex = /^\(\d{3}\)-\d{3}-\d{4}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  // Set profilePicture initial value as null instead of an empty string.
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePicture: null,
    role: 'CLIENT',
  });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false);

  const [loginUser] = useMutation(LOGIN_USER);
  const [createUser] = useMutation(CREATE_USER);
  const navigate = useNavigate();

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted += '(' + digits.substring(0, 3);
    }
    if (digits.length >= 3) {
      formatted += ')';
    }
    if (digits.length >= 3) {
      formatted += '-' + digits.substring(3, 6);
    }
    if (digits.length >= 6) {
      formatted += '-' + digits.substring(6, 10);
    }
    return formatted;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.email || !loginForm.password) {
      return setLoginError('Please enter your email and password to continue.');
    }
    try {
      const { data } = await loginUser({ variables: loginForm });
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      navigate(data.login.user.role === 'REALTOR' ? '/realtor-dashboard' : '/');
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');

    if (
      !registerForm.firstName.trim() ||
      !registerForm.lastName.trim() ||
      !registerForm.email.trim() ||
      !registerForm.phoneNumber.trim() ||
      !registerForm.password ||
      !registerForm.confirmPassword
    ) {
      return setRegisterError('Please fill in all required fields.');
    }
    if (!emailRegex.test(registerForm.email)) {
      return setRegisterError('Please enter a valid email address.');
    }
    if (!phoneRegex.test(registerForm.phoneNumber)) {
      return setRegisterError('Phone number must be in the format (xxx)-xxx-xxxx.');
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      return setRegisterError('Password and Confirm Password must match.');
    }

    // Build the input object (do not include profilePicture here)
    const input = {
      firstName: registerForm.firstName,
      lastName: registerForm.lastName,
      gender: registerForm.gender,
      phoneNumber: registerForm.phoneNumber,
      email: registerForm.email,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword,
      role: registerForm.role,
    };

    const variables = { input };
    if (registerForm.profilePicture instanceof File) {
      variables.profilePicture = registerForm.profilePicture;
    }

    try {
      const { data } = await createUser({ variables });
      setRegisterSuccess('User registered successfully!');
      setRegisterModalOpen(false);
    } catch (error) {
      setRegisterError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
       
      <motion.div
        className="bg-white shadow-lg rounded-lg flex flex-col md:flex-col items-center overflow-hidden w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <NavLink className="navbar-brand" to="/" style={{ paddingLeft: "1rem" }}>
          <img
            src="../logo.png"
            width={100}
            alt="Company Logo"
            className="custom-logo mt-8"
          />
        </NavLink>
        <div className="p-8 mx-8 w-full">
          <h2 className="text-2xl font-bold mb-6 text-purple-600 text-center">Login</h2>
          {loginError && (
            <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-300 rounded-lg">
              {loginError}
            </div>
          )}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-gray-600">Email</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-600">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Login
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-purple-600 hover:underline"
                onClick={() => setRegisterModalOpen(true)}
              >
                Create an Account
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {isRegisterModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <motion.div
            className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl md:w-2/3 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-4 right-4">
            <button
              className="text-3xl text-white bg-red-500 hover:bg-red-700 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={() => setRegisterModalOpen(false)}
            >
              <img
                src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23ffffff' viewBox='0 0 24 24'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12'/></svg>"
                alt="Cancel Icon"
              />
            </button>


            </div>
            <h2 className="text-2xl font-bold mb-6 text-purple-600">Register</h2>
            {registerError && (
              <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-300 rounded-lg">
                {registerError}
              </div>
            )}
            {registerSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-600 border border-green-300 rounded-lg">
                {registerSuccess}
              </div>
            )}
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600">First Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={registerForm.firstName}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={registerForm.lastName}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600">Gender</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={registerForm.gender}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, gender: e.target.value })
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600">Phone Number</label>
                  <input
                    type="text"
                    placeholder="(xxx)-xxx-xxxx"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={registerForm.phoneNumber}
                    onChange={(e) =>
                      setRegisterForm({
                        ...registerForm,
                        phoneNumber: formatPhoneNumber(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600">Email</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, email: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, password: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600">Profile Picture</label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      profilePicture: e.target.files[0],
                    })
                  }
                />
                {registerForm.profilePicture && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(registerForm.profilePicture)}
                      alt="Profile Preview"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Register
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login;