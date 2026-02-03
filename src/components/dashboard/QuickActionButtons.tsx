'use client';

import React from 'react';
import { useUIStore } from '@/stores';
import { useI18n } from '@/i18n/i18nContext';
import { Button } from '@/components/ui/button';
import { Zap, Plus, RotateCcw } from 'lucide-react';

interface QuickActionButtonsProps {
  onGenerate?: () => void;
  onCreateExam?: () => void;
  onReview?: () => void;
}

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  onGenerate,
  onCreateExam,
  onReview,
}) => {
  const { t } = useI18n();
  const { darkMode } = useUIStore();

  return (
    <div
      className={`p-6 rounded-lg border ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          onClick={onGenerate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Zap size={18} />
          {t('dashboard.generateQuestions')}
        </Button>
        <Button
          onClick={onCreateExam}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus size={18} />
          {t('dashboard.createExam')}
        </Button>
        <Button
          onClick={onReview}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
        >
          <RotateCcw size={18} />
          {t('dashboard.reviewHistory')}
        </Button>
      </div>
    </div>
  );
};

