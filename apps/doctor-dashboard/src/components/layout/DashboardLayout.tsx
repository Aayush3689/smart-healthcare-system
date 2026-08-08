import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Role, User } from '../../types';
import { authService } from '../../services/auth.service';

interface DashboardLayoutProps {
  role: Role;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user: User | null = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex">
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          HealthAI Decision Support System — Powered by Machine Learning.
        </footer>
      </div>
    </div>
  );
};