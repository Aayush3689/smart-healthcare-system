import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, MapPin, FileText, Users, Settings, Activity } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Villages', path: '/villages', icon: MapPin },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transition-transform duration-200 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center gap-3 h-16 px-6 bg-slate-950 border-b border-slate-800">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-white">HealthAI</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Admin Intelligence</p>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};