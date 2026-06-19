import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate, useLocation } from 'react-router-dom';

// GraphQL Mutation for Resetting Password with Token
const RESET_PASSWORD_WITH_TOKEN = gql`
  mutation ResetPasswordWithToken($input: ResetPasswordWithTokenInput!) {
    resetPasswordWithToken(input: $input) {
      success
      message
      redirectTo
    }
  }
`;

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetPasswordWithToken] = useMutation(RESET_PASSWORD_WITH_TOKEN);
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from query parameters (URL)
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Invalid or expired reset token.');
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const { data } = await resetPasswordWithToken({
        variables: {
          input: { token, password },
        },
      });

      console.log(data);
      setMessage('Your password has been successfully updated.');

      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white shadow-lg rounded-lg p-8 m-8 w-1/4">
        <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">
          Reset Your Password
        </h2>

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
          {/* New Password */}
          <div>
            <label className="block text-gray-600">New Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-600">Confirm Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Reset Password
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
      </div>
    </div>
  );
};

export default ResetPassword;
