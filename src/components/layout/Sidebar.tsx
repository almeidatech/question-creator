'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '@/stores';
import {
  LayoutDashboard,
  HelpCircle,
  BookOpen,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/questions', label: 'Questions', icon: HelpCircle },
  { href: '/exams', label: 'Exams', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute }) => {
  const { sidebarOpen, toggleSidebar, darkMode } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r transition-transform duration-300 z-30 lg:static lg:top-0 lg:h-full lg:translate-x-0 ${
          darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex lg:hidden justify-end p-4">
          <button onClick={toggleSidebar} aria-label="Close sidebar">
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? darkMode
                      ? 'bg-blue-900 text-blue-100'
                      : 'bg-blue-50 text-blue-700'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

