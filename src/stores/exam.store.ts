import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer_index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  explanation?: string;
}

export interface ExamBuilderState {
  selectedQuestions: Question[];
  duration: number; // in minutes
  passingScore: number; // 0-100
  examName: string;
  examDescription: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  currentQuestionIndex: number;
  answers: (number | null)[]; // index of selected option, or null if not answered
  startedAt: Date;
  totalTime: number; // in seconds
}

export interface ExamStore {
  // Builder state
  builder: ExamBuilderState;
  setSelectedQuestions: (questions: Question[]) => void;
  setDuration: (duration: number) => void;
  setPassingScore: (score: number) => void;
  setExamName: (name: string) => void;
  setExamDescription: (description: string) => void;
  resetBuilder: () => void;

  // Current attempt state
  currentAttempt: ExamAttempt | null;
  initializeAttempt: (examId: string, questions: Question[]) => void;
  recordAnswer: (questionIndex: number, answerIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  jumpToQuestion: (index: number) => void;
  updateTotalTime: (seconds: number) => void;
  completeAttempt: () => void;
  resetAttempt: () => void;

  // Exam creation
  isCreatingExam: boolean;
  setIsCreatingExam: (isCreating: boolean) => void;
}

const initialBuilderState: ExamBuilderState = {
  selectedQuestions: [],
  duration: 30,
  passingScore: 70,
  examName: '',
  examDescription: '',
};

const initialAttemptState: ExamAttempt = {
  id: '',
  examId: '',
  currentQuestionIndex: 0,
  answers: [],
  startedAt: new Date(),
  totalTime: 0,
};

export const useExamStore = create<ExamStore>()(
  persist(
    (set) => ({
      // Builder state initialization
      builder: initialBuilderState,

      setSelectedQuestions: (questions) =>
        set((state) => ({
          builder: { ...state.builder, selectedQuestions: questions },
        })),

      setDuration: (duration) =>
        set((state) => ({
          builder: { ...state.builder, duration: Math.max(5, Math.min(180, duration)) },
        })),

      setPassingScore: (score) =>
        set((state) => ({
          builder: { ...state.builder, passingScore: Math.max(0, Math.min(100, score)) },
        })),

      setExamName: (name) =>
        set((state) => ({
          builder: { ...state.builder, examName: name },
        })),

      setExamDescription: (description) =>
        set((state) => ({
          builder: { ...state.builder, examDescription: description },
        })),

      resetBuilder: () => set({ builder: initialBuilderState }),

      // Current attempt state
      currentAttempt: null,

      initializeAttempt: (examId, questions) => {
        const attemptId = `attempt_${Date.now()}_${Math.random()}`;
        set({
          currentAttempt: {
            id: attemptId,
            examId,
            currentQuestionIndex: 0,
            answers: new Array(questions.length).fill(null),
            startedAt: new Date(),
            totalTime: 0,
          },
        });
      },

      recordAnswer: (questionIndex, answerIndex) =>
        set((state) => {
          if (!state.currentAttempt) return state;
          const newAnswers = [...state.currentAttempt.answers];
          newAnswers[questionIndex] = answerIndex;
          return {
            currentAttempt: {
              ...state.currentAttempt,
              answers: newAnswers,
            },
          };
        }),

      nextQuestion: () =>
        set((state) => {
          if (!state.currentAttempt) return state;
          const maxIndex = state.builder.selectedQuestions.length - 1;
          return {
            currentAttempt: {
              ...state.currentAttempt,
              currentQuestionIndex: Math.min(
                state.currentAttempt.currentQuestionIndex + 1,
                maxIndex
              ),
            },
          };
        }),

      previousQuestion: () =>
        set((state) => {
          if (!state.currentAttempt) return state;
          return {
            currentAttempt: {
              ...state.currentAttempt,
              currentQuestionIndex: Math.max(
                state.currentAttempt.currentQuestionIndex - 1,
                0
              ),
            },
          };
        }),

      jumpToQuestion: (index) =>
        set((state) => {
          if (!state.currentAttempt) return state;
          const maxIndex = state.builder.selectedQuestions.length - 1;
          return {
            currentAttempt: {
              ...state.currentAttempt,
              currentQuestionIndex: Math.max(0, Math.min(index, maxIndex)),
            },
          };
        }),

      updateTotalTime: (seconds) =>
        set((state) => {
          if (!state.currentAttempt) return state;
          return {
            currentAttempt: {
              ...state.currentAttempt,
              totalTime: seconds,
            },
          };
        }),

      completeAttempt: () =>
        set((state) => {
          if (!state.currentAttempt) return state;
          return {
            currentAttempt: {
              ...state.currentAttempt,
              // Mark as complete by keeping the state
            },
          };
        }),

      resetAttempt: () => set({ currentAttempt: null }),

      // Exam creation
      isCreatingExam: false,
      setIsCreatingExam: (isCreating) => set({ isCreatingExam: isCreating }),
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({
        builder: state.builder,
      }),
    }
  )
);
