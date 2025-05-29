// /home/huyen/handmade-store/frontend/src/routes/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, adminLoading } = useContext(AuthContext);
  const location = useLocation();

  if (adminLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;