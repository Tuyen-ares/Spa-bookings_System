

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { User, UserRole } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactElement;
  adminOnly?: boolean;
  staffOnly?: boolean; // New prop for staff-only routes
  loginPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, adminOnly = false, staffOnly = false, loginPath = '/login' }) => {
  const location = useLocation();

  if (!user) {
    // Save the intended path to sessionStorage before redirecting to login.
    sessionStorage.setItem('redirectPath', location.pathname + location.search);
    return <Navigate to={loginPath} replace />;
  }

  if (adminOnly && user.role !== 'Admin') {
    // If not an admin, redirect to home page
    return <Navigate to="/" replace />;
  }
  
  if (staffOnly && !['Admin', 'Staff'].includes(user.role)) {
      return <Navigate to="/" replace />;
  }


  return children;
};

export default ProtectedRoute;
