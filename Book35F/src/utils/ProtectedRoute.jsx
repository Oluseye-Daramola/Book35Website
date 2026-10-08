

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';





export const ProtectedRoute = ({ children }) => {
  
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return <p role="status">Loading your account...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
  
};