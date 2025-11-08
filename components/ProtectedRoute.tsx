

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

  // Normalize role to handle case-insensitive comparison
  const userRole = (user.role || '').toString().toLowerCase();

  if (adminOnly && userRole !== 'admin') {
    // If not an admin, redirect based on role
    if (userRole === 'staff') {
      return <Navigate to="/staff" replace />;
    }
    return <Navigate to="/" replace />;
  }
  
  if (staffOnly && !['admin', 'staff'].includes(userRole)) {
    // If not staff or admin, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
