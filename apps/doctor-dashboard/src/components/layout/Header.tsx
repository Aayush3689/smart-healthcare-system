import React, { useState } from 'react';
import { User } from '../../types';
import { Search, Bell, Menu, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuToggle, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, vitals, village reports..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/20 focus:border-[#1976D2]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#1976D2]/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1976D2] text-white flex items-center justify-center font-bold text-xs">
                {user?.name.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-none">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-slate-500 capitalize mt-1">
                {user?.role === 'doctor' ? 'Medical Officer' : 'System Administrator'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
              <a
                href={`/${user?.role}/settings`}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => setDropdownOpen(false)}
              >
                <UserIcon className="w-4 h-4" /> Profile Settings
              </a>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};