import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Role } from '../../types';
import { authService } from '../../services/auth.service';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Brain,
  Share2,
  Settings,
  BarChart3,
  MapPin,
  FileText,
  UserCheck,
  LogOut,
  Stethoscope,
  Activity,
  CalendarDays,
  RefreshCw
} from 'lucide-react';

interface SidebarProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const doctorLinks = [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/doctor/patients', label: 'Patients', icon: Users },
    { to: '/doctor/assessments', label: 'Assessments', icon: ClipboardList },
    { to: '/doctor/predictions', label: 'AI Predictions', icon: Brain },
    { to: '/doctor/referrals', label: 'Referrals', icon: Share2 },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctor/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/villages', label: 'Villages', icon: MapPin },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/admin/follow-ups', label: 'Follow-ups', icon: RefreshCw },
    { to: '/admin/users', label: 'Users', icon: UserCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const links = role === 'doctor' ? doctorLinks : adminLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1976D2] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">HealthAI</h1>
              <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                Healthcare Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {role} PORTAL
          </div>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/doctor' || item.to === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#E3F2FD] text-[#1976D2] font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="mb-3 px-2 py-1.5 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#1976D2] shrink-0" />
            <span className="text-xs text-slate-600 font-medium truncate">
              Decision Support Active
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
