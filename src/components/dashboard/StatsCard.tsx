'use client';

import React from 'react';
import { useUIStore } from '@/stores';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: number | string;
  trend?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  trend,
  icon,
  color = 'blue',
}) => {
  const { darkMode } = useUIStore();

  const colorClasses = {
    blue: darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-900',
    green: darkMode ? 'bg-green-900 text-green-100' : 'bg-green-50 text-green-900',
    purple: darkMode ? 'bg-purple-900 text-purple-100' : 'bg-purple-50 text-purple-900',
    orange: darkMode ? 'bg-orange-900 text-orange-100' : 'bg-orange-50 text-orange-900',
  };

  const trendColor =
    trend === undefined ? '' : trend >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div
      className={`p-6 rounded-lg border ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      } transition-transform hover:scale-105`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {label}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
              {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        {icon && <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>}
      </div>
    </div>
  );
};
