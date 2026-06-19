import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// GraphQL Mutation for Password Reset
const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      id
      firstName
      lastName
      email
      role
      createdAt
    }
  }
`;

const ForgotPassword = () => {
    const [email, setEmail] = useState(''); // Change state to a string
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [resetPassword] = useMutation(RESET_PASSWORD);
    const navigate = useNavigate();
  
    const handleReset = async (e) => {
      e.preventDefault();
      setMessage('');
      setError('');
  
      try {
        const { data } = await resetPassword({ variables: { input: { email } } }); // Pass email inside an object
        console.log(data);
        setMessage('A reset link has been sent to your email.');
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          className="bg-white shadow-lg rounded-lg p-8 m-8 w-1/4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">Forgot Password</h2>
  
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-300 rounded-lg">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-600 border border-green-300 rounded-lg">
              {message}
            </div>
          )}
  
          <form className="space-y-4" onSubmit={handleReset}>
            <div>
              <label className="block text-gray-600">Email Address</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Send Reset Link
            </button>
          </form>
  
          <div className="text-center mt-4">
            <button
              className="text-sm text-purple-600 hover:underline"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  };
  

export default ForgotPassword;
