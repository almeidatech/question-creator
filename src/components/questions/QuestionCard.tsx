'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

interface QuestionCardProps {
  question: Question;
  onSubmit: (selectedOption: 'a' | 'b' | 'c' | 'd') => void;
  onNext: () => void;
  isLoading?: boolean;
}

type OptionKey = 'a' | 'b' | 'c' | 'd';

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onSubmit,
  onNext,
  isLoading = false,
}) => {
  const { darkMode } = useUIStore();
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = () => {
    if (!selectedOption) return;

    const correct = selectedOption === question.correct_answer;
    setIsCorrect(correct);
    setSubmitted(true);
    onSubmit(selectedOption);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(null);
    onNext();
  };

  const optionLabels: Record<OptionKey, string> = {
    a: 'A',
    b: 'B',
    c: 'C',
    d: 'D',
  };

  return (
    <div
      className={`max-w-2xl mx-auto p-6 rounded-lg border ${
        darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{question.text}</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Question ID: {question.id}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {(Object.keys(question.options) as OptionKey[]).map((option) => {
          const isSelected = selectedOption === option;
          const isAnswerRevealed = submitted;
          const isCorrectOption = option === question.correct_answer;

          let bgColor = '';
          if (!isAnswerRevealed) {
            bgColor = isSelected
              ? darkMode
                ? 'bg-blue-900 border-blue-500'
                : 'bg-blue-50 border-blue-500'
              : darkMode
                ? 'hover:bg-gray-700 border-gray-600'
                : 'hover:bg-gray-50 border-gray-300';
          } else {
            if (isCorrectOption) {
              bgColor = darkMode
                ? 'bg-green-900 border-green-500'
                : 'bg-green-50 border-green-500';
            } else if (isSelected && !isCorrect) {
              bgColor = darkMode
                ? 'bg-red-900 border-red-500'
                : 'bg-red-50 border-red-500';
            } else {
              bgColor = darkMode
                ? 'border-gray-600 opacity-50'
                : 'border-gray-300 opacity-50';
            }
          }

          return (
            <button
              key={option}
              onClick={() => !submitted && setSelectedOption(option)}
              disabled={submitted || isLoading}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-start gap-3 ${bgColor} disabled:cursor-not-allowed`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                  isSelected
                    ? darkMode
                      ? 'border-blue-400 bg-blue-500 text-white'
                      : 'border-blue-500 bg-blue-500 text-white'
                    : darkMode
                      ? 'border-gray-500 text-gray-400'
                      : 'border-gray-400 text-gray-600'
                }`}
              >
                {optionLabels[option]}
              </div>
              <div className="flex-1">
                <p className="font-medium">{question.options[option]}</p>
              </div>
              {isAnswerRevealed && isCorrectOption && (
                <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-1" />
              )}
              {isAnswerRevealed && isSelected && !isCorrect && (
                <XCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after submit) */}
      {submitted && (
        <div
          className={`p-4 rounded-lg mb-6 border-l-4 ${
            isCorrect
              ? darkMode
                ? 'bg-green-900 border-green-500 text-green-100'
                : 'bg-green-50 border-green-500 text-green-900'
              : darkMode
                ? 'bg-red-900 border-red-500 text-red-100'
                : 'bg-red-50 border-red-500 text-red-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {isCorrect ? (
                <CheckCircle size={24} />
              ) : (
                <XCircle size={24} />
              )}
            </div>
            <div>
              <h3 className="font-bold mb-2">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </h3>
              <p className="text-sm">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Submitting...' : 'Submit Answer'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            Next Question
            <ChevronRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};
