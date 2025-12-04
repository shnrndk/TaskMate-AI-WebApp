import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isTokenValid = () => {
    const token = localStorage.getItem('token'); // Replace this with your token storage method
    if (!token) return false;

    try {
      // Decode and validate the token (you may use a library like jwt-decode for decoding)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return tokenPayload.exp > now; // Check if token is expired
    } catch (error) {
      console.error('Invalid token', error);
      return false;
    }
  };

  return isTokenValid() ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;