import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Role, User } from '../types';
import { authService } from '../services/auth.service';

interface ProtectedRouteProps {
  allowedRole: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
  const user: User | null = authService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'doctor' ? '/doctor' : '/admin'} replace />;
  }

  return <Outlet />;
};