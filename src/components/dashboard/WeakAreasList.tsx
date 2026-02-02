'use client';

import React from 'react';
import { useUIStore } from '@/stores';
import { WeakArea } from '@/stores';
import { AlertTriangle } from 'lucide-react';

interface WeakAreasListProps {
  areas: WeakArea[];
}

export const WeakAreasList: React.FC<WeakAreasListProps> = ({ areas }) => {
  const { darkMode } = useUIStore();

  const sortedAreas = [...areas].sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div
      className={`p-6 rounded-lg border ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      <h3 className="text-lg font-semibold mb-4">Areas for Improvement</h3>
      {sortedAreas.length === 0 ? (
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Great job! No weak areas detected.
        </p>
      ) : (
        <div className="space-y-3">
          {sortedAreas.map((area) => (
            <div
              key={area.topic}
              className={`p-4 rounded-lg border ${
                darkMode
                  ? 'border-orange-700 bg-orange-950'
                  : 'border-orange-200 bg-orange-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  <span className="font-medium">{area.topic}</span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {area.accuracy.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    area.accuracy < 30
                      ? 'bg-red-500'
                      : area.accuracy < 50
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                  }`}
                  style={{ width: `${area.accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
