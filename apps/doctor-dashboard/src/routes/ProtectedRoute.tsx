import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Role, User } from '../types';
import { authService } from '../services/auth.service';

interface ProtectedRouteProps {
  allowedRole: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRole }) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    authService.validateSession()
      .then((currentUser) => active && setUser(currentUser))
      .catch(() => active && setUser(null))
      .finally(() => active && setChecking(false));
    return () => { active = false; };
  }, []);

  if (checking) return <div className="min-h-screen bg-slate-50" />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'doctor' ? '/doctor' : '/admin'} replace />;
  }

  return <Outlet />;
};
