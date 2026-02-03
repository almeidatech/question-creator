'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import { ActivityData } from '@/stores';

interface ActivityChartProps {
  data: ActivityData[];
  type?: 'line' | 'bar';
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data, type = 'line' }) => {
  const { t } = useI18n();
  const { darkMode } = useUIStore();

  if (data.length === 0) {
    return (
      <div
        className={`p-6 rounded-lg border ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        } flex items-center justify-center h-64`}
      >
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          {t('dashboard.noActivityData')}
        </p>
      </div>
    );
  }

  const chartConfig = {
    data: data,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
  };

  const ChartComponent = type === 'line' ? LineChart : BarChart;

  return (
    <div
      className={`p-6 rounded-lg border ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      <h3 className="text-lg font-semibold mb-4">{t('dashboard.thisWeekActivity')}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data} margin={chartConfig.margin}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? '#374151' : '#e5e7eb'}
          />
          <XAxis
            dataKey="date"
            stroke={darkMode ? '#9ca3af' : '#6b7280'}
          />
          <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: darkMode ? '#f3f4f6' : '#000000' }}
          />
          <Legend />
          {type === 'line' ? (
            <Line
              type="monotone"
              dataKey="questions_answered"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          ) : (
            <Bar dataKey="questions_answered" fill="#3b82f6" />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

