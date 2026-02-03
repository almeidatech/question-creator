'use client';

import React from 'react';
import { useAuthStore, useUIStore, User } from '@/stores';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { toggleDarkMode, darkMode } = useUIStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header
      className={`sticky top-0 z-40 ${
        darkMode
          ? 'bg-gray-900 text-gray-100 border-gray-700'
          : 'bg-white text-gray-900 border-gray-200'
      } border-b shadow-sm`}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className={`lg:hidden p-2 rounded-lg ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
          <div className="font-bold text-xl">Q-Creator</div>
        </div>

        {/* Right: User menu + Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right text-sm">
                <div className="font-medium">{user.first_name}</div>
                <div
                  className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {user.email}
                </div>
              </div>
              <button
                onClick={onLogout}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-red-900 text-red-400'
                    : 'hover:bg-red-50 text-red-600'
                }`}
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

